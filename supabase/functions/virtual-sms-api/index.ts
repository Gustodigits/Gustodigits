
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const VIRTUALSMS_API_KEY = Deno.env.get("VIRTUALSMS_API_KEY") ?? "";
const VS_BASE = "https://virtualsms.io/api/v1";
const DEFAULT_MARKUP_PERCENT = 100;
const CANCELLATION_WAIT_MS = 120_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type Obj = Record<string, any>;

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "REQUEST_FAILED",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function json(data: Obj, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function str(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function norm(value: unknown): string {
  return str(value).toLowerCase();
}

function num(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const n = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function first(obj: Obj, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return undefined;
}

function obj(value: unknown): Obj {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Obj
    : {};
}

function rows(value: unknown): Obj[] {
  if (Array.isArray(value)) return value.map(obj).filter((x) => Object.keys(x).length > 0);

  const data = obj(value);

  for (const key of ["data", "results", "countries", "services", "orders", "items"]) {
    if (Array.isArray(data[key])) {
      return data[key].map(obj).filter((x: Obj) => Object.keys(x).length > 0);
    }
  }

  if (data.data && typeof data.data === "object") {
    return rows(data.data);
  }

  return [];
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function messageOf(value: unknown): string {
  const data = obj(value);
  const nested = obj(data.data);
  const error = obj(data.error);

  return str(
    first(data, ["message", "errorDescription", "error_description", "description", "detail"]) ??
    first(nested, ["message", "errorDescription", "error_description", "description", "detail"]) ??
    first(error, ["message", "errorDescription", "error_description", "description", "detail"]) ??
    (typeof data.error === "string" ? data.error : ""),
  );
}

function normalizeCountryName(value: unknown, originalCode?: unknown): string {
  const name = norm(value).replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  const code = norm(originalCode);

  const aliases: Record<string, string> = {
    us: "United States",
    usa: "United States",
    "u s": "United States",
    "u s a": "United States",
    "united states": "United States",
    "united states of america": "United States",
    gb: "United Kingdom",
    uk: "United Kingdom",
    "u k": "United Kingdom",
    "great britain": "United Kingdom",
    britain: "United Kingdom",
    "united kingdom": "United Kingdom",
    england: "England",
  };

  return aliases[name] ?? aliases[code] ?? str(value);
}

function countryKeyOf(item: Obj): string {
  return str(first(item, [
    "country_id", "countryId", "country_code", "countryCode",
    "iso2", "iso", "iso3", "code", "id", "country",
  ]));
}

function countryNameOf(item: Obj): string {
  const name = first(item, [
    "country_name", "countryName", "name", "title", "country",
  ]);
  return normalizeCountryName(name ?? countryKeyOf(item), countryKeyOf(item));
}

function serviceCodeOf(item: Obj): string {
  return str(first(item, [
    "service_code", "serviceCode", "code", "service_id",
    "serviceId", "id", "service",
  ]));
}

function serviceNameOf(item: Obj): string {
  return str(first(item, [
    "service_name", "serviceName", "name", "title", "service",
  ]));
}

/**
 * IMPORTANT:
 * Always append the endpoint to the full API base URL.
 * Do not use new URL("/customer/countries", `${VS_BASE}/`):
 * a leading slash would discard the /api/v1 prefix.
 */
function providerUrl(path: string): URL {
  const base = VS_BASE.replace(/\/+$/, "");
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${endpoint}`);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "virtualsms.io" ||
    !url.pathname.startsWith("/api/v1/")
  ) {
    throw new ApiError("Invalid service endpoint.", 500, "INVALID_ENDPOINT");
  }

  return url;
}

async function providerRequest(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<{ status: number; data: unknown }> {
  if (!VIRTUALSMS_API_KEY) {
    throw new ApiError(
      "The number service is not configured. Please contact support.",
      500,
      "SERVICE_NOT_CONFIGURED",
    );
  }

  const url = providerUrl(path);
  const headers: Record<string, string> = {
    "X-API-Key": VIRTUALSMS_API_KEY,
    "Accept": "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(25000),
    });
  } catch (error) {
    console.error("VirtualSMS network error:", error instanceof Error ? error.message : error);
    throw new ApiError(
      "The provider response could not be confirmed. Check the order status before trying again.",
      504,
      "PROVIDER_OUTCOME_UNKNOWN",
    );
  }

  return { status: response.status, data: await readBody(response) };
}

async function requireUser(req: Request): Promise<{ id: string }> {
  const authorization = req.headers.get("Authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new ApiError("Please sign in again.", 401, "UNAUTHORIZED");
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
  });

  const { data, error } = await client.auth.getUser(match[1]);

  if (error || !data.user) {
    throw new ApiError(
      "Your session has expired. Please sign in again.",
      401,
      "UNAUTHORIZED",
    );
  }

  return { id: data.user.id };
}

async function requireAdmin(userId: string): Promise<void> {
  const { data, error } = await db.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  if (error || !data) throw new ApiError("Access denied.", 403, "ADMIN_ONLY");
}

async function serviceEnabled(country: string, service: string): Promise<boolean> {
  const { data, error } = await db.from("virtualsms_service_settings").select("is_active")
    .eq("country_key", country).eq("service_code", service).maybeSingle();
  if (error) throw new ApiError("Service settings could not be checked.", 500);
  return !data || data.is_active !== false;
}

async function rpc(name: string, args: Obj): Promise<Obj> {
  const { data, error } = await db.rpc(name, args);

  if (error) {
    console.error(`Database operation ${name} failed:`, error.message);

    if (/INSUFFICIENT_FUNDS/i.test(error.message)) {
      throw new ApiError("INSUFFICIENT_FUNDS", 400, "INSUFFICIENT_FUNDS");
    }

    throw new ApiError(
      "The order could not be processed. Please contact support if your balance changed.",
      500,
      "DATABASE_OPERATION_FAILED",
    );
  }

  if (!data || typeof data !== "object") {
    throw new ApiError("The database returned an invalid response.", 500);
  }

  return data as Obj;
}

async function getExchangeRate(): Promise<number> {
  for (const url of [
    "https://open.er-api.com/v6/latest/USD",
    "https://api.frankfurter.app/latest?from=USD&to=NGN",
  ]) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;

      const data = await response.json();
      const rate = num(data?.rates?.NGN);

      if (rate > 0) return rate;
    } catch {
      // Try the next exchange-rate source.
    }
  }

  throw new ApiError(
    "The current exchange rate is unavailable. Please try again later.",
    503,
    "EXCHANGE_RATE_UNAVAILABLE",
  );
}

async function getMarkup(countryKey: string, serviceCode: string): Promise<number> {
  const { data, error } = await db
    .from("virtual_number_markup_rules")
    .select("server,country_key,service_code,markup_percent,is_active")
    .eq("server", "virtualsms")
    .eq("is_active", true);

  if (error) {
    console.error("Markup lookup failed:", error.message);
    throw new ApiError("Pricing configuration could not be loaded.", 500);
  }

  const rules = data ?? [];
  const find = (country: string | null, service: string | null) =>
    rules.find((rule) =>
      (rule.country_key == null ? null : str(rule.country_key)) === country &&
      (rule.service_code == null ? null : norm(rule.service_code)) === service
    );

  const rule =
    find(str(countryKey), norm(serviceCode)) ??
    find(null, norm(serviceCode)) ??
    find(str(countryKey), null) ??
    find(null, null);

  const markup = rule ? num(rule.markup_percent) : DEFAULT_MARKUP_PERCENT;

  if (!Number.isFinite(markup) || markup < 0) {
    throw new ApiError("The configured markup is invalid.", 500);
  }

  return markup;
}

async function listCountries(service?: string): Promise<Obj[]> {
  const query = new URLSearchParams();
  if (service) query.set("service", service);

  const path = "/customer/countries" + (query.size ? `?${query}` : "");
  const result = await providerRequest(path);

  if (result.status < 200 || result.status >= 300) {
    console.error("Country lookup failed:", result.status, messageOf(result.data));
    throw new ApiError(
      "Countries could not be loaded. Please try again.",
      502,
      "COUNTRIES_UNAVAILABLE",
    );
  }

  return rows(result.data).map((item) => {
    const key = countryKeyOf(item);
    const name = countryNameOf(item);

    return {
      id: key,
      countryKey: key,
      name,
      countryName: name,
      country: name,
    };
  }).filter((item) => item.id && item.name);
}

async function listServices(country: string): Promise<Obj[]> {
  if (!country) throw new ApiError("Please select a country first.");

  const result = await providerRequest(`/customer/services?country=${encodeURIComponent(country)}`);
  if (result.status < 200 || result.status >= 300) {
    console.error("Service lookup failed:", result.status, messageOf(result.data));
    throw new ApiError("Services could not be loaded. Please try again.", 502, "SERVICES_UNAVAILABLE");
  }

  const catalogue = rows(result.data).map((item) => {
    const code = serviceCodeOf(item);
    const name = serviceNameOf(item) || code;
    return { id: code, name, serviceName: name };
  }).filter((item) => item.id && item.name);

  // Fetch this country settings once. The provider catalogue contains thousands of services;
  // a sequential database lookup for every service makes the selector appear to hang.
  const { data: settings, error } = await db.from("virtualsms_service_settings")
    .select("service_code,is_active")
    .eq("country_key", country);
  if (error) {
    console.error("Service settings lookup failed:", error.message);
    throw new ApiError("Service settings could not be checked.", 500);
  }
  const disabled = new Set((settings || [])
    .filter((item) => item.is_active === false)
    .map((item) => norm(item.service_code)));
  const available = catalogue.filter((item) => !disabled.has(norm(item.id)));
  console.info("VirtualSMS service catalogue loaded:", { country, total: available.length });
  return available;
}
async function getQuote(country: string, service: string): Promise<Obj> {
  if (!country || !service) {
    throw new ApiError("Please select a country and service.");
  }

  const query = new URLSearchParams({ country, service });
  const result = await providerRequest(`/price?${query}`);

  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(
      "The price for this service is currently unavailable.",
      502,
      "PRICE_UNAVAILABLE",
    );
  }

  const data = obj(result.data);
  const nested = obj(data.data);
  const providerUsd = num(
    first(data, ["price", "cost", "amount", "price_usd", "priceUsd"]) ??
    first(nested, ["price", "cost", "amount", "price_usd", "priceUsd"]),
  );

  if (providerUsd <= 0) {
    throw new ApiError("The service did not return a valid price.", 502, "INVALID_PROVIDER_PRICE");
  }

  if (!(await serviceEnabled(country, service))) throw new ApiError("This service is currently unavailable. Please choose another service.", 409, "SERVICE_DISABLED");

  const [exchangeRate, markupPercent] = await Promise.all([
    getExchangeRate(),
    getMarkup(country, service),
  ]);

  const customerPriceNgn = money(
    providerUsd * exchangeRate * (1 + markupPercent / 100),
  );

  return {
    ok: true,
    providerUsd,
    exchangeRate,
    markupPercent,
    customerPriceNgn,
    price: customerPriceNgn,
    currency: "NGN",
  };
}

function providerOrderId(value: unknown): string {
  const data = obj(value);
  const nested = obj(data.data);
  const order = obj(data.order);
  return str(
    first(data, ["order_id", "orderId", "id", "activation_id", "activationId", "request_id"]) ??
    first(nested, ["order_id", "orderId", "id", "activation_id", "activationId"]) ??
    first(order, ["order_id", "orderId", "id", "activation_id", "activationId", "request_id"]),
  );
}

function phoneOf(value: unknown): string {
  const data = obj(value);
  const nested = obj(data.data);
  const order = obj(data.order);
  return str(
    first(data, ["phone_number", "phoneNumber", "number", "phone", "mobile"]) ??
    first(nested, ["phone_number", "phoneNumber", "number", "phone", "mobile"]) ??
    first(order, ["phone_number", "phoneNumber", "number", "phone", "mobile"]),
  );
}

function messagesOf(value: unknown): Obj[] {
  const data = obj(value);
  const nested = obj(data.data);
  const order = obj(data.order);
  const result: Obj[] = [];
  for (const root of [data, nested, order]) {
    if (Array.isArray(root.messages)) result.push(...root.messages.map(obj));
  }
  return result;
}

function smsTextCandidates(value: unknown): string[] {
  const found: string[] = [];
  const textKeys = new Set([
    "sms_text", "smstext", "full_sms", "fullsms", "text", "sms",
    "message", "content", "body", "message_text", "messagetext",
  ]);
  const visit = (item: unknown, depth = 0, key = ""): void => {
    if (depth > 5 || item == null) return;
    if (typeof item === "string" || typeof item === "number") {
      if (textKeys.has(key.toLowerCase())) {
        const text = String(item).trim();
        if (text && !/^https?:\/\//i.test(text)) found.push(text);
      }
      return;
    }
    if (Array.isArray(item)) {
      for (const entry of item) visit(entry, depth + 1, key);
      return;
    }
    if (typeof item === "object") {
      for (const [childKey, child] of Object.entries(item as Obj)) {
        visit(child, depth + 1, childKey);
      }
    }
  };
  visit(value);
  return [...new Set(found)];
}

function extractOtpFromText(text: string): string {
  const normalized = text.replace(/&#10;|&#13;|&nbsp;/gi, " ");
  const contextual = normalized.match(
    /(?:code|otp|verification(?:\s+code)?)\D{0,24}(\d{3}[- ]\d{3}|\d{4,8})/i,
  );
  const grouped = normalized.match(/\b(\d{3}[- ]\d{3})\b/);
  const plain = normalized.match(/\b(\d{4,8})\b/);
  const candidate = contextual?.[1] || grouped?.[1] || plain?.[1] || "";
  return candidate.replace(/\s+/g, "-");
}

function otpOf(value: unknown): string {
  const data = obj(value);
  const nested = obj(data.data);
  const order = obj(data.order);
  const direct = str(
    first(data, ["otp", "code", "sms_code", "smsCode", "verification_code", "verificationCode"]) ??
    first(nested, ["otp", "code", "sms_code", "smsCode", "verification_code", "verificationCode"]) ??
    first(order, ["otp", "code", "sms_code", "smsCode", "verification_code", "verificationCode"]),
  );
  if (direct && !/^https?:\/\//i.test(direct)) return direct;

  for (const message of messagesOf(value)) {
    const explicit = str(first(message, ["code", "otp", "sms_code", "smsCode", "pin", "verification_code"]));
    if (explicit && !/^https?:\/\//i.test(explicit)) return explicit;
  }

  for (const text of smsTextCandidates(value)) {
    const code = extractOtpFromText(text);
    if (code) return code;
  }
  return "";
}

function smsTextOf(value: unknown): string {
  return smsTextCandidates(value)[0] || "";
}

function statusOf(value: unknown): string {
  const data = obj(value);
  const nested = obj(data.data);
  const order = obj(data.order);
  return norm(first(data, ["status", "state"]) ?? first(nested, ["status", "state"]) ?? first(order, ["status", "state"]));
}

function insufficientProviderFunds(status: number, value: unknown): boolean {
  const data = obj(value);
  const nested = obj(data.data);
  const error = obj(data.error);

  const code = str(
    first(data, ["errorCode", "error_code", "code"]) ??
    first(nested, ["errorCode", "error_code", "code"]) ??
    first(error, ["errorCode", "error_code", "code"]),
  );

  return status === 402 ||
    /insufficient.?balance|insufficient.?funds|insufficient.?credits|not.?enough.?funds|not.?enough.?balance|low.?balance|out.?of.?credits/i
      .test(`${code} ${messageOf(value)}`);
}

function isDefinitiveRejection(status: number): boolean {
  return status >= 400 && status < 500 &&
    ![408, 425, 429].includes(status);
}

function isFailedStatus(status: unknown): boolean {
  return [
    "failed", "failure", "rejected", "refunded",
    "refund_pending", "purchase_failed",
  ].includes(norm(status));
}

function realActivationId(order: Obj): string {
  const id = str(order.provider_activation_id || order.activation_id);
  return id && !id.startsWith("pending:") ? id : "";
}

function hasRealNumber(order: Obj): boolean {
  return Boolean(realActivationId(order) && str(order.phone_number));
}

async function updateOrder(orderId: string, values: Obj): Promise<Obj> {
  const { data, error } = await db
    .from("virtual_number_orders")
    .update(values)
    .eq("id", orderId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Order update failed:", error?.message);
    throw new ApiError(
      "The order could not be updated. Please contact support before trying again.",
      500,
      "ORDER_UPDATE_FAILED",
    );
  }

  return data as Obj;
}

async function findOrder(userId: string, orderId: string): Promise<Obj> {
  if (!orderId) throw new ApiError("Order ID is required.");

  const { data, error } = await db
    .from("virtual_number_orders")
    .select("*")
    .eq("user_id", userId)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Order lookup failed:", error.message);
    throw new ApiError("Could not load the order.", 500);
  }

  if (!data) throw new ApiError("Virtual number order not found.", 404);
  return data as Obj;
}

async function refundOrder(userId: string, orderId: string, reason: string): Promise<Obj> {
  return await rpc("refund_virtual_number_purchase", {
    p_user_id: userId,
    p_order_id: orderId,
    p_reason: reason,
  });
}

function publicOrder(order: Obj): Obj {
  const country = normalizeCountryName(
    order.country_name || order.country || "",
    order.country_key,
  );
  const service = str(order.service_name || order.service || "");

  return {
    id: order.id,
    orderId: order.id,
    provider: "virtualsms",
    provider_activation_id: order.provider_activation_id || order.activation_id || null,
    activation_id: order.activation_id || order.provider_activation_id || null,
    phoneNumber: order.phone_number || null,
    phone_number: order.phone_number || null,
    country: country || "Unknown country",
    countryName: country || "Unknown country",
    service: service || "Unknown service",
    serviceName: service || "Unknown service",
    status: order.status,
    otpCode: order.otp_code || order.sms_code || order.code || null,
    otp_code: order.otp_code || order.sms_code || order.code || null,
    smsCode: order.sms_code || order.otp_code || order.code || null,
    sms_code: order.sms_code || order.otp_code || order.code || null,
    smsText: order.sms_text || order.text || null,
    sms_text: order.sms_text || order.text || null,
    code: order.code || order.otp_code || order.sms_code || null,
    text: order.text || order.sms_text || null,
    price: order.customer_price_ngn ?? order.price ?? null,
    customerPriceNgn: order.customer_price_ngn ?? order.price ?? null,
    createdAt: order.created_at,
    created_at: order.created_at,
    updatedAt: order.updated_at,
    updated_at: order.updated_at,
    purchasedAt: order.purchased_at || null,
    purchased_at: order.purchased_at || null,
  };
}

async function markFailedAndRefund(
  userId: string,
  orderId: string,
  reason: string,
): Promise<boolean> {
  /*
   * Do not refund an ambiguous timeout. This function is called only
   * for a definitive provider rejection.
   *
   * The refund RPC must be idempotent. Keep the reservation hidden
   * by setting failed status after refund processing.
   */
  try {
    const refund = await refundOrder(userId, orderId, reason);

    try {
      await updateOrder(orderId, {
        status: "failed",
        phone_number: null,
        otp_code: null,
        sms_code: null,
        sms_text: null,
        code: null,
        text: null,
      });
    } catch (error) {
      console.error("Could not mark rejected order as failed:", error);
    }

    return Boolean(refund.already_refunded || refund.success !== false);
  } catch (error) {
    console.error("Refund processing failed:", error);

    try {
      await updateOrder(orderId, {
        status: "refund_pending",
        phone_number: null,
        otp_code: null,
        sms_code: null,
        sms_text: null,
        code: null,
        text: null,
      });
    } catch (updateError) {
      console.error("Could not mark refund pending:", updateError);
    }

    return false;
  }
}

async function buy(body: Obj, userId: string, req: Request): Promise<Obj> {
  const countryKey = str(
    body.countryKey ?? body.countryId ?? body.country_id ?? body.country,
  );
  const serviceCode = str(
    body.serviceCode ?? body.service_code ?? body.serviceId ??
    body.service_id ?? body.service,
  );
  const countryName = normalizeCountryName(
    body.countryName ?? body.country_name ?? body.countryLabel ?? countryKey,
    countryKey,
  );
  const serviceName = str(
    body.serviceName ?? body.service_name ?? body.serviceLabel ?? serviceCode,
  );

  if (!countryKey || !serviceCode) {
    throw new ApiError("Please select a country and service.");
  }

  const quote = await getQuote(countryKey, serviceCode);
  const customerPriceNgn = num(quote.customerPriceNgn);
  const requestId = str(
    body.requestId ?? body.clientRequestId ?? body.client_request_id ??
    body.idempotencyKey ?? req.headers.get("Idempotency-Key"),
  ) || crypto.randomUUID();

  let reservation: Obj;

  try {
    reservation = await rpc("reserve_virtual_number_purchase", {
      p_user_id: userId,
      p_request_id: requestId,
      p_provider: "virtualsms",
      p_country: countryName,
      p_country_key: countryKey,
      p_service: serviceName,
      p_service_code: serviceCode,
      p_service_name: serviceName,
      p_provider_usd: num(quote.providerUsd),
      p_exchange_rate: num(quote.exchangeRate),
      p_markup_percent: num(quote.markupPercent),
      p_customer_price_ngn: customerPriceNgn,
    });
  } catch (error) {
    if (/INSUFFICIENT_FUNDS/i.test(error instanceof Error ? error.message : "")) {
      const { data: wallet } = await db
        .from("wallet")
        .select("balance")
        .eq("user-id", userId)
        .maybeSingle();

      const balance = num(wallet?.balance);
      const shortfall = money(Math.max(0, customerPriceNgn - balance));

      return {
        ok: false,
        error: "INSUFFICIENT_FUNDS",
        message: `Insufficient funds. Please add ₦${shortfall.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} to your wallet.`,
        requiredAmount: customerPriceNgn,
        currentBalance: balance,
        shortfall,
      };
    }

    throw error;
  }

  const orderId = str(reservation.order_id);
  if (!orderId) throw new ApiError("The order reservation failed.", 500);

  if (reservation.already_exists) {
    const existing = await findOrder(userId, orderId);

    if (isFailedStatus(existing.status)) {
      return {
        ok: false,
        error: "PURCHASE_FAILED",
        message: "This purchase was not completed. Please start a new purchase.",
      };
    }

    if (hasRealNumber(existing)) {
      return { ok: true, alreadyExists: true, order: publicOrder(existing) };
    }

    return {
      ok: false,
      uncertain: true,
      error: "PURCHASE_CHECK_REQUIRED",
      orderId,
      message: "This purchase is still being checked. Check its status before trying again.",
    };
  }

  let result: { status: number; data: unknown };

  try {
    // Correct documented endpoint: POST /api/v1/customer/purchase
    result = await providerRequest("/customer/purchase", {
      method: "POST",
      body: { service: serviceCode, country: countryKey },
    });
  } catch (error) {
    console.error("VirtualSMS purchase outcome uncertain:", error);
    return {
      ok: false,
      uncertain: true,
      error: "PURCHASE_CHECK_REQUIRED",
      orderId,
      message: "The purchase outcome could not be confirmed. Check its status before trying again.",
    };
  }

  if (result.status < 200 || result.status >= 300) {
    console.error("VirtualSMS purchase rejected:", result.status, messageOf(result.data));

    if (insufficientProviderFunds(result.status, result.data)) {
      const refunded = await markFailedAndRefund(
        userId,
        orderId,
        "VirtualSMS provider insufficient funds. Customer purchase rejected.",
      );

      return refunded
        ? {
          ok: false,
          error: "PROVIDER_INSUFFICIENT_FUNDS",
          message: "Insufficient funds. Please contact support.",
        }
        : {
          ok: false,
          error: "REFUND_PENDING",
          orderId,
          message: "Insufficient funds. Please contact support.",
        };
    }

    if (isDefinitiveRejection(result.status)) {
      const refunded = await markFailedAndRefund(
        userId,
        orderId,
        "VirtualSMS definitively rejected the purchase.",
      );

      return refunded
        ? {
          ok: false,
          error: "PURCHASE_REJECTED",
          message: "Purchase could not be completed. Please try again.",
        }
        : {
          ok: false,
          error: "REFUND_PENDING",
          orderId,
          message: "The purchase could not be completed. Please contact support if your balance has not been restored.",
        };
    }

    return {
      ok: false,
      uncertain: true,
      error: "PURCHASE_CHECK_REQUIRED",
      orderId,
      message: "The purchase outcome could not be confirmed. Check its status before trying again.",
    };
  }

  const activationId = providerOrderId(result.data);
  const phoneNumber = phoneOf(result.data);
  const otp = otpOf(result.data);
  const smsText = smsTextOf(result.data);
  const providerStatus = statusOf(result.data);

  if (!activationId || !phoneNumber) {
    console.error("VirtualSMS purchase response missing order details.");

    try {
      await updateOrder(orderId, {
        activation_id: activationId || null,
        provider_activation_id: activationId || null,
        phone_number: phoneNumber || null,
        country: countryName,
        country_name: countryName,
        country_id: countryKey,
        country_key: countryKey,
        service: serviceName,
        service_name: serviceName,
        service_code: serviceCode,
        provider: "virtualsms",
        status: "processing",
      });
    } catch (error) {
      console.error("Could not save incomplete provider response:", error);
    }

    return {
      ok: false,
      uncertain: true,
      error: "PURCHASE_CHECK_REQUIRED",
      orderId,
      message: "The purchase is being checked because the provider did not return all number details.",
    };
  }

  let saved: Obj;

  try {
    saved = await updateOrder(orderId, {
      activation_id: activationId,
      provider_activation_id: activationId,
      phone_number: phoneNumber,
      country: countryName,
      country_name: countryName,
      country_id: countryKey,
      country_key: countryKey,
      service: serviceName,
      service_name: serviceName,
      service_code: serviceCode,
      provider: "virtualsms",
      provider_id: "virtualsms",
      server_id: "virtualsms",
      server_name: "VirtualSMS",
      server_label: "VirtualSMS",
      provider_usd: quote.providerUsd,
      exchange_rate: quote.exchangeRate,
      markup_percent: quote.markupPercent,
      status: providerStatus || "waiting",
      otp_code: otp || null,
      sms_code: otp || null,
      code: otp || null,
      sms_text: smsText || null,
      text: smsText || null,
      purchased_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Provider purchase succeeded but saving order failed:", error);

    return {
      ok: false,
      uncertain: true,
      error: "ORDER_SAVE_FAILED",
      orderId,
      message: "The number may have been purchased, but its details could not be saved. Contact support before trying again.",
    };
  }

  return { ok: true, success: true, order: publicOrder(saved) };
}

async function checkStatus(body: Obj, userId: string): Promise<Obj> {
  const orderId = str(body.orderId ?? body.order_id ?? body.id);
  const order = await findOrder(userId, orderId);

  if (isFailedStatus(order.status)) {
    return {
      ok: false,
      error: "PURCHASE_FAILED",
      message: "This purchase was not completed. Please start a new purchase.",
    };
  }

  const activationId = realActivationId(order);

  if (!activationId) {
    return {
      ok: false,
      uncertain: true,
      processing: true,
      orderId: order.id,
      message: "The provider has not confirmed the number details yet. Please check again shortly.",
    };
  }

  // Correct documented endpoint: GET /customer/order/{id}
  const result = await providerRequest(
    `/customer/order/${encodeURIComponent(activationId)}`,
  );

  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(
      "The order status could not be retrieved. Please try again.",
      502,
      "STATUS_UNAVAILABLE",
    );
  }

  const otp = otpOf(result.data);
  const smsText = smsTextOf(result.data);
  const providerStatus = statusOf(result.data);
  const patch: Obj = {};

  if (otp) {
    patch.otp_code = otp;
    patch.sms_code = otp;
    patch.code = otp;
  }

  if (smsText) {
    patch.sms_text = smsText;
    patch.text = smsText;
  }

  // An OTP by itself does not mean verification completed.
  if (providerStatus) patch.status = providerStatus;

  const saved = Object.keys(patch).length
    ? await updateOrder(order.id, patch)
    : order;

  return { ok: true, order: publicOrder(saved) };
}

async function cancelOrder(body: Obj, userId: string): Promise<Obj> {
  const orderId = str(body.orderId ?? body.order_id ?? body.id);
  const order = await findOrder(userId, orderId);

  if (["cancelled", "canceled", "refunded"].includes(norm(order.status))) {
    return {
      ok: true,
      alreadyRefunded: true,
      order: publicOrder(order),
      message: "This order has already been cancelled or refunded.",
    };
  }

  if (isFailedStatus(order.status)) {
    return {
      ok: false,
      error: "PURCHASE_FAILED",
      message: "This purchase was not completed. No cancellation is required.",
    };
  }

  const activationId = realActivationId(order);

  if (!activationId || !str(order.phone_number)) {
    throw new ApiError(
      "The order has no confirmed phone number yet. Check its status before cancelling.",
      409,
      "ORDER_NOT_CONFIRMED",
    );
  }

  const purchasedAt = Date.parse(str(order.purchased_at || order.created_at));

  if (!Number.isFinite(purchasedAt)) {
    throw new ApiError(
      "The purchase time could not be verified. Please contact support.",
      409,
      "PURCHASE_TIME_UNAVAILABLE",
    );
  }

  const remaining = CANCELLATION_WAIT_MS - (Date.now() - purchasedAt);

  if (remaining > 0) {
    throw new ApiError(
      `Please wait at least two minutes after purchasing before cancelling. Try again in about ${Math.ceil(remaining / 1000)} seconds.`,
      409,
      "CANCELLATION_WAIT",
    );
  }

  // Verify current provider status before attempting cancellation.
  const statusResult = await providerRequest(
    `/customer/order/${encodeURIComponent(activationId)}`,
  );

  if (statusResult.status < 200 || statusResult.status >= 300) {
    throw new ApiError(
      "The number status could not be verified. No cancellation or refund was issued.",
      409,
      "STATUS_UNAVAILABLE",
    );
  }

  const currentStatus = statusOf(statusResult.data);
  const sms = otpOf(statusResult.data);
  const smsText = smsTextOf(statusResult.data);

  if (["completed", "complete", "success", "successful"].includes(currentStatus)) {
    const patch: Obj = { status: currentStatus };

    if (sms) {
      patch.otp_code = sms;
      patch.sms_code = sms;
      patch.code = sms;
    }

    if (smsText) {
      patch.sms_text = smsText;
      patch.text = smsText;
    }

    const saved = await updateOrder(order.id, patch);

    return {
      ok: false,
      error: "NUMBER_ALREADY_COMPLETED",
      order: publicOrder(saved),
      message: "This verification is already completed, so it cannot be cancelled for a refund.",
    };
  }

  const alreadyCancelled = ["cancelled", "canceled", "refunded"].includes(currentStatus);

  if (!alreadyCancelled) {
    // Correct documented endpoint: POST /customer/cancel/{id}
    const result = await providerRequest(
      `/customer/cancel/${encodeURIComponent(activationId)}`,
      { method: "POST" },
    );

    if (result.status < 200 || result.status >= 300) {
      console.error("VirtualSMS cancellation not confirmed:", result.status, messageOf(result.data));

      throw new ApiError(
        "The cancellation was not confirmed by the provider. No refund was issued.",
        409,
        "CANCELLATION_NOT_CONFIRMED",
      );
    }

    const providerMessage = norm(messageOf(result.data));
    const returnedStatus = statusOf(result.data);
    const responseObj = obj(result.data);
    const successFlag = first(responseObj, ["success", "ok"]);

    if (
      successFlag === false ||
      /not cancelled|cannot cancel|unable to cancel|cancellation failed|cancel failed|pending cancellation/i.test(providerMessage) ||
      ["failed", "pending", "processing"].includes(returnedStatus)
    ) {
      throw new ApiError(
        "The provider has not confirmed cancellation. No refund was issued.",
        409,
        "CANCELLATION_NOT_CONFIRMED",
      );
    }
  }

  // Refund only after cancellation has been accepted by the provider.
  const refund = await refundOrder(
    userId,
    order.id,
    "Customer cancelled VirtualSMS number after the required wait.",
  );

  const saved = await updateOrder(order.id, { status: "cancelled" });

  return {
    ok: true,
    success: true,
    alreadyRefunded: Boolean(refund.already_refunded),
    order: publicOrder(saved),
    message: refund.already_refunded
      ? "The number was cancelled. This order had already been refunded."
      : "The number was cancelled and your wallet was refunded.",
  };
}

async function listOrders(userId: string): Promise<Obj> {
  const { data, error } = await db
    .from("virtual_number_orders")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "virtualsms")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Order listing failed:", error.message);
    throw new ApiError("Your orders could not be loaded.", 500, "ORDERS_UNAVAILABLE");
  }

  const visible = (data ?? []).map(obj).filter((order) =>
    !isFailedStatus(order.status) && hasRealNumber(order)
  );

  return { ok: true, orders: visible.map(publicOrder) };
}

async function walletBalance(userId: string): Promise<Obj> {
  const { data, error } = await db
    .from("wallet")
    .select("balance")
    .eq("user-id", userId)
    .maybeSingle();

  if (error) {
    console.error("Wallet lookup failed:", error.message);
    throw new ApiError("Your wallet could not be loaded.", 500, "WALLET_UNAVAILABLE");
  }

  return { ok: true, balance: num(data?.balance), currency: "NGN" };
}


async function adminAction(body: Obj, userId: string): Promise<Obj> {
  await requireAdmin(userId);
  const action = norm(body.action);
  if (action === "admin_countries") return { ok: true, countries: await listCountries() };
  if (action === "admin_services") {
    const country = str(body.country_id || body.country || "US");
    return { ok: true, services: await listServices(country) };
  }
  if (action === "list_service_settings") {
    const { data, error } = await db.from("virtualsms_service_settings").select("*").order("country_key").order("service_name");
    if (error) throw new ApiError("Could not load service settings.", 500);
    return { ok: true, settings: data || [] };
  }
  if (action === "save_service_setting") {
    const country = str(body.country_id || body.country_key);
    const service = str(body.service_code);
    if (!country || !service) throw new ApiError("Country and service are required.");
    const values = { country_key: country, service_code: service, service_name: str(body.service_name) || service, is_active: body.is_active !== false, updated_at: new Date().toISOString() };
    const { data: found } = await db.from("virtualsms_service_settings").select("id").eq("country_key", country).eq("service_code", service).maybeSingle();
    const result = found
      ? await db.from("virtualsms_service_settings").update(values).eq("id", found.id).select("*").single()
      : await db.from("virtualsms_service_settings").insert(values).select("*").single();
    if (result.error) throw new ApiError("Could not save service setting.", 500);
    return { ok: true, setting: result.data };
  }
  if (action === "list_price_rules") {
    const { data, error } = await db.from("virtual_number_markup_rules").select("*").eq("server", "virtualsms").order("updated_at", { ascending: false });
    if (error) throw new ApiError("Could not load pricing rules.", 500);
    return { ok: true, rules: data || [] };
  }
  if (action === "save_price_rule") {
    const country = str(body.country_key || body.country_id) || null;
    const service = str(body.service_code) || null;
    const mode = str(body.pricing_mode || "markup");
    const markup = num(body.markup_percent ?? DEFAULT_MARKUP_PERCENT);
    const fixed = num(body.fixed_price_ngn);
    if (!["markup","fixed"].includes(mode) || (mode === "markup" && markup < 0) || (mode === "fixed" && fixed <= 0)) throw new ApiError("Enter a valid markup or fixed price.");
    let q = db.from("virtual_number_markup_rules").select("id").eq("server","virtualsms");
    q = country ? q.eq("country_key",country) : q.is("country_key",null);
    q = service ? q.eq("service_code",service) : q.is("service_code",null);
    const { data: found } = await q.limit(1).maybeSingle();
    const values = { server:"virtualsms", country_key:country, service_code:service, server_id:null, pricing_mode:mode, markup_percent:mode==="markup"?markup:100, fixed_price_ngn:mode==="fixed"?fixed:null, is_active:true, updated_at:new Date().toISOString() };
    const result = found
      ? await db.from("virtual_number_markup_rules").update(values).eq("id",found.id).select("*").single()
      : await db.from("virtual_number_markup_rules").insert(values).select("*").single();
    if (result.error) throw new ApiError("Could not save pricing rule.",500);
    return { ok:true, rule:result.data };
  }
  if (action === "delete_price_rule") {
    const { error } = await db.from("virtual_number_markup_rules").delete().eq("id",str(body.id)).eq("server","virtualsms");
    if (error) throw new ApiError("Could not delete pricing rule.",500);
    return { ok:true };
  }
  throw new ApiError("Unsupported admin action.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST for this endpoint.",
    }, 405);
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new ApiError(
        "The service is not configured. Please contact support.",
        500,
        "SERVICE_NOT_CONFIGURED",
      );
    }

    const user = await requireUser(req);

    let body: Obj;
    try {
      body = obj(await req.json());
    } catch {
      throw new ApiError("Invalid JSON request body.");
    }

    const adminActions = ["admin_countries","admin_services","list_service_settings","save_service_setting","list_price_rules","save_price_rule","delete_price_rule"];
    if (adminActions.includes(norm(body.action))) return json(await adminAction(body, user.id));

    switch (norm(body.action)) {
      case "countries": {
        const service = str(
          body.serviceCode ?? body.service_code ?? body.serviceId ??
          body.service_id ?? body.service,
        );

        return json({ ok: true, countries: await listCountries(service || undefined) });
      }

      case "services": {
        const country = str(
          body.countryKey ?? body.countryId ?? body.country_id ?? body.country,
        );

        // listServices already filters disabled services using one country-scoped
        // settings query. Do not repeat a sequential database lookup per service.
        const available = await listServices(country);
        return json({ ok: true, services: available });
      }

      case "price":
      case "quote": {
        const country = str(
          body.countryKey ?? body.countryId ?? body.country_id ?? body.country,
        );
        const service = str(
          body.serviceCode ?? body.service_code ?? body.serviceId ??
          body.service_id ?? body.service,
        );

        return json(await getQuote(country, service));
      }

      case "buy":
        return json(await buy(body, user.id, req));

      case "status":
        return json(await checkStatus(body, user.id));

      case "cancel":
        return json(await cancelOrder(body, user.id));

      case "orders":
        return json(await listOrders(user.id));

      case "wallet":
        return json(await walletBalance(user.id));

      default:
        throw new ApiError(
          "Unsupported action. Use countries, services, price, quote, buy, status, cancel, orders, or wallet.",
          400,
          "UNSUPPORTED_ACTION",
        );
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`VirtualSMS request failed (${error.status}):`, error.message);

      return json({
        ok: false,
        error: error.code,
        message: error.message,
      }, error.status);
    }

    console.error(
      "Unexpected VirtualSMS error:",
      error instanceof Error ? error.message : error,
    );

    return json({
      ok: false,
      error: "INTERNAL_ERROR",
      message: "The request could not be completed. Please try again.",
    }, 500);
  }
});
