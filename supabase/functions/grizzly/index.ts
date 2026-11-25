import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SB_PUBLISHABLE_KEY") ??
  "";

const GRIZZLY_API_KEY =
  Deno.env.get("GRIZZLY_API_KEY")?.trim() ?? "";

const GRIZZLY_BASE =
  "https://api.grizzlysms.com/stubs/handler_api.php";

const GRIZZLY_SERVICES_PAGE =
  "https://grizzlysms.com/services";

const DEFAULT_MARKUP_PERCENT = 100;

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

/* =========================================================
COMPLETE GRIZZLY COUNTRY MAP
========================================================= */

const COUNTRY_NAMES: Record<string, string> =
Object.fromEntries(
  `Afghanistan|74
Albania|155
Algeria|58
American Samoa|10161
Andorra|1062
Angola|76
Anguilla|181
Antigua and Barbuda|169
Argentina|39
Armenia|148
Aruba|179
Australia|175
Austria|50
Azerbaijan|35
Bahamas|122
Bahrain|145
Bangladesh|60
Barbados|118
Belgium|82
Belize|124
Benin|120
Bermuda|1003
Bhutan|158
Bolivia|92
Bosnia and Herzegovina|108
Botswana|123
Brazil|73
Brunei Darussalam|121
Bulgaria|83
Burkina Faso|152
Burundi|119
Cambodia|24
Cameroon|41
Canada|36
Cape Verde|186
Cayman Islands|170
Central African Republic|125
Chad|42
Chile|151
China|3
Colombia|33
Comoros|133
Costa Rica|93
Croatia|45
Cyprus|77
Czech Republic|63
DR Congo|18
Denmark|172
Djibouti|168
Dominica|126
Dominican Republic|109
Ecuador|105
Egypt|21
Equatorial Guinea|167
Eritrea|176
Estonia|34
Ethiopia|71
Finland|163
France|78
French Guiana|162
French Polynesia|1012
Gabon|154
Gambia|28
Georgia|128
Germany|43
Ghana|38
Gibraltar|201
Greece|129
Greenland|1008
Grenada|127
Guadeloupe|160
Guatemala|94
Guinea|68
Guinea-Bissau|130
Guyana|131
Haiti|26
Honduras|88
Hong Kong|14
Hungary|84
Iceland|132
India|22
Indonesia|6
Ireland|23
Israel|13
Italy|86
Ivory Coast|27
Jamaica|103
Japan|182
Jordan|116
Kazakhstan|2
Kenya|8
Kosovo|203
Kuwait|100
Kyrgyzstan|11
Laos|25
Latvia|49
Lesotho|136
Liberia|135
Liechtenstein|10348
Lithuania|44
Luxembourg|165
Macao|20
Madagascar|17
Malawi|137
Malaysia|7
Maldives|159
Mali|69
Malta|199
Martinique|1011
Mauritania|114
Mauritius|157
Mexico|54
Moldova|85
Monaco|144
Mongolia|72
Montenegro|171
Montserrat|180
Morocco|37
Mozambique|80
Namibia|138
Nepal|81
Netherlands|48
New Caledonia|185
New Zealand|67
Nicaragua|90
Niger|139
Nigeria|19
Niue|204
North Macedonia|183
Norway|174
Oman|107
Pakistan|66
Palestine|188
Panama|112
Papua New Guinea|79
Paraguay|87
Peru|65
Philippines|4
Poland|15
Portugal|117
Puerto Rico|97
Qatar|111
Republic of the Congo|150
Reunion|146
Romania|32
Rwanda|140
Saint Kitts and Nevis|134
Saint Lucia|164
Saint Vincent|166
Salvador|101
Samoa|10231
Sao Tome and Principe|178
Saudi Arabia|53
Senegal|61
Serbia|29
Seychelles|184
Sierra Leone|115
Singapore|10351
Sint Maarten|10349
Slovakia|141
Slovenia|59
Somalia|149
South Africa|31
South Korea|10350
South Sudan|177
Spain|56
Sri Lanka|64
Suriname|142
Swaziland|106
Sweden|46
Switzerland|173
Taiwan|55
Tajikistan|143
Tanzania|9
Thailand|52
Timor-Leste|91
Togo|99
Tonga|10227
Trinidad and Tobago|104
Tunisia|89
Turkey|62
Turkmenistan|161
Uganda|75
Ukraine|1
United Arab Emirates|95
United Kingdom|16
Uruguay|156
USA|187
USA (virtual)|12
Uzbekistan|40
Vanuatu|1007
Vietnam|10
Yemen|30
Zambia|147
Zimbabwe|96
Fiji|189`
    .trim()
    .split("\n")
    .map((line) => {
      const [name, id] = line.split("|");

      return [
        String(id).trim(),
        String(name).trim(),
      ];
    }),
);

/* =========================================================
COUNTRY ALIASES
========================================================= */

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "187",
  us: "187",
  "united states": "187",
  "united states of america": "187",

  "usa virtual": "12",
  "usa (virtual)": "12",
  "us virtual": "12",

  uk: "16",
  "great britain": "16",
  england: "16",

  canada: "36",
  nigeria: "19",
};

/* =========================================================
SERVICE ALIASES
========================================================= */

const SERVICE_ALIASES: Record<string, string> = {
  wa: "WhatsApp",
  whatsapp: "WhatsApp",

  fb: "Facebook",
  facebook: "Facebook",

  tg: "Telegram",
  telegram: "Telegram",

  go: "Google",
  google: "Google",
  gmail: "Google / Gmail",

  ya: "Yahoo",
  yahoo: "Yahoo",

  ig: "Instagram",
  instagram: "Instagram",

  tt: "TikTok",
  tiktok: "TikTok",

  tw: "Twitter / X",
  twitter: "Twitter / X",
  x: "Twitter / X",

  vk: "VK",

  discord: "Discord",
  ds: "Discord",

  uber: "Uber",
  ub: "Uber",

  netflix: "Netflix",
  nf: "Netflix",

  amazon: "Amazon",
  am: "Amazon",

  apple: "Apple",
  appleid: "Apple",

  viber: "Viber",
  vi: "Viber",

  line: "Line",
  li: "Line",

  signal: "Signal",
  si: "Signal",

  snapchat: "Snapchat",
  sn: "Snapchat",

  paypal: "PayPal",
  pp: "PayPal",

  grab: "Grab",
  gr: "Grab",

  imo: "Imo",

  wechat: "WeChat",
  wc: "WeChat",

  skype: "Skype",
  sk: "Skype",

  reddit: "Reddit",

  linkedin: "LinkedIn",

  youtube: "YouTube",
  yt: "YouTube",

  microsoft: "Microsoft",
  ms: "Microsoft",

  airbnb: "Airbnb",

  spotify: "Spotify",

  foodpanda: "Foodpanda",

  shopee: "Shopee",

  walmart: "Walmart",

  ebay: "eBay",
};

/* =========================================================
GENERIC HELPERS
========================================================= */

function json(data: unknown, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}

function cleanString(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    typeof value === "object"
  ) {
    return "";
  }

  return String(value).trim();
}

function normalizeKey(value: unknown): string {
  return cleanString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const s = cleanString(value);

    if (s) {
      return s;
    }
  }

  return "";
}

function countryNameFromAny(
  value: unknown,
  fallbackCode = "",
): string {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const obj =
      value as Record<string, unknown>;

    const direct = firstNonEmpty(
      obj.name,
      obj.country_name,
      obj.countryName,
      obj.eng,
      obj.english,
      obj.title,
      obj.label,
      obj.country,
    );

    if (
      direct &&
      !/^\d+$/.test(direct)
    ) {
      return direct;
    }
  }

  const raw = cleanString(value);

  if (raw) {
    const normalized =
      normalizeKey(raw);

    if (COUNTRY_ALIASES[normalized]) {
      return (
        COUNTRY_NAMES[
          COUNTRY_ALIASES[normalized]
        ] ?? raw
      );
    }

    if (COUNTRY_NAMES[raw]) {
      return COUNTRY_NAMES[raw];
    }

    const reverse =
      Object.entries(
        COUNTRY_NAMES,
      ).find(
        ([, name]) =>
          normalizeKey(name) ===
          normalized,
      );

    if (reverse) {
      return reverse[1];
    }

    if (!/^\d+$/.test(raw)) {
      return raw;
    }
  }

  if (fallbackCode) {
    return (
      COUNTRY_NAMES[fallbackCode] ??
      `Country ${fallbackCode}`
    );
  }

  return "Unknown Country";
}

function resolveCountryCode(
  value: unknown,
): string {
  const raw =
    cleanString(value);

  if (!raw) {
    return "";
  }

  if (COUNTRY_NAMES[raw]) {
    return raw;
  }

  const normalized =
    normalizeKey(raw);

  if (COUNTRY_ALIASES[normalized]) {
    return COUNTRY_ALIASES[normalized];
  }

  const found =
    Object.entries(
      COUNTRY_NAMES,
    ).find(
      ([, name]) =>
        normalizeKey(name) ===
        normalized,
    );

  return found?.[0] ?? raw;
}

function serviceCodeFromObject(
  value: unknown,
): string {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const obj =
      value as Record<string, unknown>;

    return firstNonEmpty(
      obj.service_code,
      obj.serviceCode,
      obj.code,
      obj.service,
      obj.product,
      obj.key,
    );
  }

  return cleanString(value);
}

function serviceNameFromObject(
  value: unknown,
  code = "",
): string {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const obj =
      value as Record<string, unknown>;

    const name =
      firstNonEmpty(
        obj.service_name,
        obj.serviceName,
        obj.name,
        obj.title,
        obj.label,
        obj.product_name,
        obj.display_name,
        obj.displayName,
      );

    if (
      name &&
      !/^\[object Object\]$/i.test(name)
    ) {
      return name;
    }
  }

  const rawCode =
    cleanString(
      code ||
      serviceCodeFromObject(value),
    );

  if (!rawCode) {
    return "Unknown Service";
  }

  const normalized =
    normalizeKey(rawCode);

  if (SERVICE_ALIASES[normalized]) {
    return SERVICE_ALIASES[normalized];
  }

  if (
    SERVICE_ALIASES[
      rawCode.toLowerCase()
    ]
  ) {
    return SERVICE_ALIASES[
      rawCode.toLowerCase()
    ];
  }

  return rawCode;
}

/* =========================================================
GRIZZLY REQUEST
========================================================= */

async function grizzlyRequest(
  action: string,
  params: Record<string, unknown> = {},
) {
  if (!GRIZZLY_API_KEY) {
    throw new Error(
      "GRIZZLY_API_KEY is not configured.",
    );
  }

  const url =
    new URL(GRIZZLY_BASE);

  url.searchParams.set(
    "api_key",
    GRIZZLY_API_KEY,
  );

  url.searchParams.set(
    "action",
    action,
  );

  for (
    const [
      key,
      value,
    ] of Object.entries(params)
  ) {
    if (
      value !== undefined &&
      value !== null &&
      String(value) !== ""
    ) {
      url.searchParams.set(
        key,
        String(value),
      );
    }
  }

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",
        headers: {
          Accept:
            "application/json,text/plain,*/*",
        },
      },
    );

  const text =
    await response.text();

  let data: unknown = text;

  try {
    data = JSON.parse(text);
  } catch {
    // Grizzly may return plain text.
  }

  if (!response.ok) {
    let providerErrorMessage = "";

    if (typeof data === "string") {
      providerErrorMessage = data.trim();
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      const errorObject = data as Record<string, unknown>;
      providerErrorMessage = firstNonEmpty(
        errorObject.error,
        errorObject.error_code,
        errorObject.errorCode,
        errorObject.message,
        errorObject.msg,
        errorObject.description,
      );
    }

    throw new Error(
      providerErrorMessage || `Grizzly HTTP ${response.status}`,
    );
  }

  if (typeof data === "string") {
    const responseText = data.trim();
    const normalizedResponse = responseText.toUpperCase();

    /*
    Successful Grizzly purchases may be returned as plain text:
    ACCESS_NUMBER:activationId:phoneNumber. Known plain-text errors
    must be thrown so buyNumber can distinguish an unavailable server
    from a real provider-balance error.
    */
    const isPlainTextSuccess =
      /^ACCESS_NUMBER\s*:/i.test(responseText);

    const normalizedErrorCode = normalizedResponse
      .replace(/[\s-]+/g, "_");

    const isProviderOrApiError =
      normalizedResponse.startsWith("BAD_KEY") ||
      normalizedResponse.startsWith("BAD_ACTION") ||
      normalizedResponse.startsWith("BAD_SERVICE") ||
      normalizedResponse.startsWith("BAD_COUNTRY") ||
      normalizedResponse.startsWith("BAD_PROVIDER") ||
      normalizedResponse.startsWith("ERROR") ||
      normalizedResponse.startsWith("NO_") ||
      normalizedResponse.startsWith("NO ") ||
      normalizedResponse.startsWith("INSUFFICIENT_FUND") ||
      normalizedResponse.startsWith("INSUFFICIENT FUND") ||
      normalizedResponse.startsWith("INSUFFICIENT BALANCE") ||
      normalizedResponse.startsWith("NOT_ENOUGH_MONEY") ||
      normalizedResponse.startsWith("NOT ENOUGH MONEY") ||
      normalizedResponse.startsWith("NO MONEY") ||
      normalizedResponse.startsWith("NO BALANCE") ||
      normalizedErrorCode.includes("SERVER_NOT_AVAILABLE") ||
      normalizedErrorCode.includes("SERVER_UNAVAILABLE") ||
      normalizedErrorCode.includes("PROVIDER_NOT_AVAILABLE") ||
      normalizedErrorCode.includes("PROVIDER_UNAVAILABLE") ||
      normalizedErrorCode.includes("NO_NUMBERS") ||
      normalizedErrorCode.includes("NO_ACTIVATION") ||
      normalizedErrorCode.includes("NO_STOCK") ||
      normalizedErrorCode.includes("OUT_OF_STOCK") ||
      normalizedErrorCode.includes("NOT_AVAILABLE") ||
      normalizedErrorCode.includes("UNAVAILABLE") ||
      /\b(?:SERVER|PROVIDER)\s+(?:IS\s+)?(?:NOT\s+AVAILABLE|UNAVAILABLE)\b/i.test(responseText) ||
      /\b(?:NO|NOT ENOUGH|INSUFFICIENT)\s+(?:AVAILABLE\s+)?(?:NUMBERS?|ACTIVATIONS?|STOCK)\b/i.test(responseText) ||
      /\b(?:OUT OF STOCK|TRY ANOTHER SERVER|SERVER NOT AVAILABLE)\b/i.test(responseText);

    if (!isPlainTextSuccess && isProviderOrApiError) {
      throw new Error(responseText);
    }
  } else if (data && typeof data === "object" && !Array.isArray(data)) {
    /*
    Some API responses wrap the error in JSON rather than returning
    the usual plain-text code. Read explicit error fields so a JSON
    NO_NUMBERS/NO_BALANCE response is not mistaken for a successful
    purchase with a missing activation ID.
    */
    const obj = data as Record<string, unknown>;
    const status = cleanString(obj.status).toLowerCase();
    const success = obj.success;
    const errorText = firstNonEmpty(
      obj.error,
      obj.error_code,
      obj.errorCode,
      obj.message,
      obj.msg,
      obj.description,
    );

    const indicatesFailure =
      success === false ||
      status === "error" ||
      status === "failed" ||
      status === "failure" ||
      Boolean(obj.error || obj.error_code || obj.errorCode);

    if (indicatesFailure && errorText) {
      throw new Error(errorText);
    }
  }

  return data;
}

/* =========================================================
RECURSIVE OBJECT EXTRACTION
========================================================= */

function collectObjects(
  value: unknown,
  output:
    Record<string, unknown>[] = [],
  depth = 0,
): Record<string, unknown>[] {
  if (depth > 8) {
    return output;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjects(
        item,
        output,
        depth + 1,
      );
    }

    return output;
  }

  if (
    typeof value === "object"
  ) {
    const obj =
      value as Record<string, unknown>;

    output.push(obj);

    for (
      const child of Object.values(obj)
    ) {
      if (
        child &&
        typeof child === "object"
      ) {
        collectObjects(
          child,
          output,
          depth + 1,
        );
      }
    }
  }

  return output;
}

/* =========================================================
SERVICE CATALOGUE
========================================================= */

let serviceCatalogCache:
  | Record<string, string>
  | null = null;

let serviceCatalogLoadedAt = 0;

const SERVICE_CACHE_TTL =
  30 * 60 * 1000;

function addServiceCatalogEntry(
  catalog:
    Record<string, string>,
  code: unknown,
  name: unknown,
) {
  const serviceCode =
    cleanString(code);

  const serviceName =
    cleanString(name);

  if (
    !serviceCode ||
    !serviceName
  ) {
    return;
  }

  if (
    serviceName === serviceCode ||
    serviceName ===
      "[object Object]"
  ) {
    return;
  }

  catalog[serviceCode] =
    serviceName;

  catalog[
    serviceCode.toLowerCase()
  ] = serviceName;
}

async function loadServiceCatalog(): Promise<
  Record<string, string>
> {
  if (
    serviceCatalogCache &&
    Date.now() -
      serviceCatalogLoadedAt <
      SERVICE_CACHE_TTL
  ) {
    return serviceCatalogCache;
  }

  const catalog:
    Record<string, string> = {
    ...SERVICE_ALIASES,
  };

  const actions = [
    "getServicesList",
    "getServices",
    "services",
  ];

  for (
    const action of actions
  ) {
    try {
      const data =
        await grizzlyRequest(
          action,
        );

      const objects =
        collectObjects(data);

      for (
        const obj of objects
      ) {
        const code =
          firstNonEmpty(
            obj.service_code,
            obj.serviceCode,
            obj.code,
            obj.service,
            obj.product,
            obj.key,
          );

        const name =
          firstNonEmpty(
            obj.service_name,
            obj.serviceName,
            obj.name,
            obj.title,
            obj.label,
            obj.product_name,
            obj.display_name,
            obj.displayName,
          );

        addServiceCatalogEntry(
          catalog,
          code,
          name,
        );
      }

      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {
        for (
          const [
            key,
            value,
          ] of Object.entries(
            data as Record<
              string,
              unknown
            >,
          )
        ) {
          if (
            typeof value === "string" &&
            value.trim()
          ) {
            addServiceCatalogEntry(
              catalog,
              key,
              value,
            );
          }

          if (
            value &&
            typeof value === "object"
          ) {
            const name =
              serviceNameFromObject(
                value,
                key,
              );

            addServiceCatalogEntry(
              catalog,
              key,
              name,
            );
          }
        }
      }

      if (
        Object.keys(catalog).length >
        Object.keys(
          SERVICE_ALIASES,
        ).length + 20
      ) {
        break;
      }
    } catch {
      // Try next method.
    }
  }

  try {
    const response =
      await fetch(
        GRIZZLY_SERVICES_PAGE,
        {
          headers: {
            Accept:
              "text/html",
          },
        },
      );

    if (response.ok) {
      const html =
        await response.text();

      const patterns = [
        /data-code=["']([^"']+)["'][^>]*data-name=["']([^"']+)["']/gi,
        /data-service=["']([^"']+)["'][^>]*data-name=["']([^"']+)["']/gi,
        /service[_-]?code["']?\s*[:=]\s*["']([^"']+)["'][^}]{0,500}?(?:name|title)["']?\s*[:=]\s*["']([^"']+)["']/gi,
      ];

      for (
        const regex of patterns
      ) {
        let match:
          RegExpExecArray | null;

        while (
          (match =
            regex.exec(html)) !==
          null
        ) {
          addServiceCatalogEntry(
            catalog,
            match[1],
            match[2],
          );
        }
      }
    }
  } catch {
    // Supplementary only.
  }

  serviceCatalogCache =
    catalog;

  serviceCatalogLoadedAt =
    Date.now();

  return catalog;
}

async function resolveServiceName(
  code: string,
  runtimeValue?: unknown,
): Promise<string> {
  const direct =
    serviceNameFromObject(
      runtimeValue,
      code,
    );

  if (
    direct &&
    direct !== code &&
    direct !==
      "[object Object]"
  ) {
    return direct;
  }

  const catalog =
    await loadServiceCatalog();

  return (
    catalog[code] ??
    catalog[
      code.toLowerCase()
    ] ??
    SERVICE_ALIASES[
      code.toLowerCase()
    ] ??
    code
  );
}

/* =========================================================
LIVE USD -> NGN
========================================================= */

let fxCache:
  | {
      rate: number;
      expiresAt: number;
    }
  | null = null;

const FX_CACHE_TTL =
  5 * 60 * 1000;

async function getLiveUsdNgnRate(): Promise<number> {
  if (
    fxCache &&
    Date.now() <
      fxCache.expiresAt
  ) {
    return fxCache.rate;
  }

  try {
    const response =
      await fetch(
        "https://open.er-api.com/v6/latest/USD",
        {
          headers: {
            Accept:
              "application/json",
          },
        },
      );

    if (response.ok) {
      const data =
        await response.json();

      const rate =
        Number(
          data?.rates?.NGN,
        );

      if (
        Number.isFinite(rate) &&
        rate > 0
      ) {
        fxCache = {
          rate,
          expiresAt:
            Date.now() +
            FX_CACHE_TTL,
        };

        return rate;
      }
    }
  } catch {
    // fallback below
  }

  try {
    const response =
      await fetch(
        "https://api.frankfurter.app/latest?from=USD&to=NGN",
        {
          headers: {
            Accept:
              "application/json",
          },
        },
      );

    if (response.ok) {
      const data =
        await response.json();

      const rate =
        Number(
          data?.rates?.NGN,
        );

      if (
        Number.isFinite(rate) &&
        rate > 0
      ) {
        fxCache = {
          rate,
          expiresAt:
            Date.now() +
            FX_CACHE_TTL,
        };

        return rate;
      }
    }
  } catch {
    // no more fallbacks
  }

  throw new Error(
    "Live exchange rate unavailable.",
  );
}

/* =========================================================
MARKUP
========================================================= */

async function getMarkupPercent(
  countryKey: string,
  serviceCode: string,
): Promise<number> {
  const normalizedCountry =
    resolveCountryCode(countryKey).trim().toLowerCase();
  const normalizedService =
    cleanString(serviceCode).trim().toLowerCase();

  // Check the most specific rule first, then country-only,
  // service-only, and finally the global Overall rule.
  const lookups = [
    {
      country: normalizedCountry,
      service: normalizedService,
      kind: "country_service",
    },
    {
      country: normalizedCountry,
      service: null,
      kind: "country",
    },
    {
      country: null,
      service: normalizedService,
      kind: "service",
    },
    {
      country: null,
      service: null,
      kind: "overall",
    },
  ] as const;

  for (const rule of lookups) {
    let query = supabaseAdmin
      .from("virtual_number_markup_rules")
      .select("markup_percent")
      .eq("server", "grizzly")
      .eq("is_active", true);

    query = rule.country === null
      ? query.is("country_key", null)
      : query.eq("country_key", rule.country);

    query = rule.service === null
      ? query.is("service_code", null)
      : query.eq("service_code", rule.service);

    const { data, error } = await query.limit(1).maybeSingle();

    // Do not silently fall back to the default when the database
    // lookup itself failed; expose the real cause for debugging.
    if (error) {
      console.error(
        `Grizzly markup lookup failed (${rule.kind}):`,
        error.message,
      );
      throw new Error(`Unable to load Grizzly markup rule (${rule.kind}): ${error.message}`);
    }

    if (data) {
      const value = Number(data.markup_percent);
      if (Number.isFinite(value) && value >= 0) {
        return value;
      }
      throw new Error(`Invalid Grizzly markup percentage in ${rule.kind} rule.`);
    }
  }

  return DEFAULT_MARKUP_PERCENT;
}

/* =========================================================
ADMIN AUTH
========================================================= */

async function requireAdmin(
  request: Request,
) {
  const user =
    await getUser(request);

  const result =
    await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    throw new Error(
      "Admin access required.",
    );
  }

  return user;
}

/* =========================================================
LIST MARKUP RULES
========================================================= */

async function listMarkupRules(
  request: Request,
) {
  await requireAdmin(request);

  const result =
    await supabaseAdmin
      .from(
        "virtual_number_markup_rules",
      )
      .select("*")
      .eq(
        "server",
        "grizzly",
      )
      .eq(
        "is_active",
        true,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

  if (result.error) {
    throw result.error;
  }

  return {
    ok: true,
    rules:
      result.data ?? [],
  };
}

/* =========================================================
SAVE MARKUP RULE
========================================================= */

async function saveMarkupRule(
  request: Request,
  body:
    Record<string, unknown>,
) {
  await requireAdmin(request);

  const id =
    cleanString(body.id);

  let countryKey =
    firstNonEmpty(
      body.country_key,
      body.country_id,
      body.country,
    );

  let serviceCode =
    firstNonEmpty(
      body.service_code,
      body.service,
      body.product,
    );

  const markup =
    Number(
      body.markup_percent,
    );

  if (
    !Number.isFinite(markup) ||
    markup < 0
  ) {
    throw new Error(
      "Invalid markup percentage.",
    );
  }

  if (
    !countryKey ||
    countryKey === "overall" ||
    countryKey === "null"
  ) {
    countryKey = "";
  } else {
    countryKey =
      resolveCountryCode(
        countryKey,
      ).toLowerCase();
  }

  if (
    !serviceCode ||
    serviceCode === "overall" ||
    serviceCode === "null"
  ) {
    serviceCode = "";
  } else {
    serviceCode =
      cleanString(
        serviceCode,
      ).toLowerCase();
  }

  if (id) {
    const update =
      await supabaseAdmin
        .from(
          "virtual_number_markup_rules",
        )
        .update({
          server: "grizzly",
          country_key:
            countryKey || null,
          service_code:
            serviceCode || null,
          markup_percent:
            markup,
          is_active: true,
        })
        .eq(
          "id",
          id,
        )
        .eq(
          "server",
          "grizzly",
        );

    if (update.error) {
      throw update.error;
    }

    return {
      ok: true,
      message:
        "Grizzly markup rule updated.",
    };
  }

  let existingQuery =
    supabaseAdmin
      .from(
        "virtual_number_markup_rules",
      )
      .select("id")
      .eq(
        "server",
        "grizzly",
      )
      .eq(
        "is_active",
        true,
      );

  if (countryKey) {
    existingQuery =
      existingQuery.eq(
        "country_key",
        countryKey,
      );
  } else {
    existingQuery =
      existingQuery.is(
        "country_key",
        null,
      );
  }

  if (serviceCode) {
    existingQuery =
      existingQuery.eq(
        "service_code",
        serviceCode,
      );
  } else {
    existingQuery =
      existingQuery.is(
        "service_code",
        null,
      );
  }

  const existing =
    await existingQuery
      .limit(1)
      .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.id) {
    const update =
      await supabaseAdmin
        .from(
          "virtual_number_markup_rules",
        )
        .update({
          markup_percent:
            markup,
          is_active: true,
        })
        .eq(
          "id",
          existing.data.id,
        );

    if (update.error) {
      throw update.error;
    }

    return {
      ok: true,
      message:
        "Grizzly markup rule updated.",
    };
  }

  const insert =
    await supabaseAdmin
      .from(
        "virtual_number_markup_rules",
      )
      .insert({
        server: "grizzly",
        country_key:
          countryKey || null,
        service_code:
          serviceCode || null,
        markup_percent:
          markup,
        is_active: true,
      });

  if (insert.error) {
    throw insert.error;
  }

  return {
    ok: true,
    message:
      "Grizzly markup rule saved.",
  };
}

/* =========================================================
DELETE MARKUP RULE
========================================================= */

async function deleteMarkupRule(
  request: Request,
  body:
    Record<string, unknown>,
) {
  await requireAdmin(request);

  const id =
    cleanString(body.id);

  if (!id) {
    throw new Error(
      "Markup rule ID is required.",
    );
  }

  const result =
    await supabaseAdmin
      .from(
        "virtual_number_markup_rules",
      )
      .update({
        is_active: false,
      })
      .eq(
        "id",
        id,
      )
      .eq(
        "server",
        "grizzly",
      );

  if (result.error) {
    throw result.error;
  }

  return {
    ok: true,
    message:
      "Grizzly markup rule deleted.",
  };
}

/* =========================================================
CUSTOMER PRICE
========================================================= */

async function calculateCustomerPrice(
  providerUsd: number,
  country: string,
  service: string,
) {
  const fx =
    await getLiveUsdNgnRate();

  const markupPercent =
    await getMarkupPercent(
      country,
      service,
    );

  return {
    provider_usd:
      providerUsd,

    exchange_rate:
      fx,

    markup_percent:
      markupPercent,

    customer_price_ngn:
      Math.ceil(
        providerUsd *
          fx *
          (
            1 +
            markupPercent / 100
          ),
      ),
  };
}

/* =========================================================
PRICE HELPERS
========================================================= */

function findPrice(
  value: unknown,
): number {
  if (
    typeof value === "number" ||
    typeof value === "string"
  ) {
    const n =
      Number(value);

    if (
      Number.isFinite(n) &&
      n > 0
    ) {
      return n;
    }
  }

  if (Array.isArray(value)) {
    for (const candidate of value) {
      const n =
        findPrice(candidate);

      if (
        Number.isFinite(n) &&
        n > 0
      ) {
        return n;
      }
    }

    return 0;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const obj =
      value as Record<
        string,
        unknown
      >;

    const candidates = [
      obj.cost,
      obj.price,
      obj.price_usd,
      obj.priceUsd,
      obj.activationCost,
      obj.activation_cost,
      obj.minPrice,
      obj.min_price,
    ];

    for (
      const candidate of candidates
    ) {
      const n =
        findPrice(candidate);

      if (
        Number.isFinite(n) &&
        n > 0
      ) {
        return n;
      }
    }
  }

  return 0;
}

function hasStockInformation(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  const keys = [
    "count",
    "stock",
    "qty",
    "quantity",
    "available_count",
    "availableCount",
    "number_count",
    "numberCount",
    "available_numbers",
    "availableNumbers",
  ];

  return keys.some((key) =>
    Object.prototype.hasOwnProperty.call(obj, key) &&
    obj[key] !== null &&
    obj[key] !== undefined &&
    String(obj[key]).trim() !== ""
  );
}

function findStock(
  value: unknown,
): number {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return 0;
  }

  const obj =
    value as Record<
      string,
      unknown
    >;

  const candidates = [
    obj.count,
    obj.stock,
    obj.qty,
    obj.quantity,
    obj.available_count,
    obj.availableCount,
    obj.number_count,
    obj.numberCount,
    obj.available_numbers,
    obj.availableNumbers,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      typeof candidate !==
        "number" &&
      typeof candidate !==
        "string"
    ) {
      continue;
    }

    const raw =
      String(candidate).trim();

    if (!raw) {
      continue;
    }

    const n =
      Number(raw);

    if (
      Number.isFinite(n) &&
      n >= 0
    ) {
      return Math.floor(n);
    }
  }

  return 0;
}

/* =========================================================
SERVICE AVAILABILITY
========================================================= */

function findServiceAvailability(
  value: unknown,
): number {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return 0;
  }

  const obj =
    value as Record<
      string,
      unknown
    >;

  const candidates = [
    obj.stock,
    obj.count,
    obj.quantity,
    obj.qty,
    obj.available_count,
    obj.availableCount,
    obj.number_count,
    obj.numberCount,
    obj.available_numbers,
    obj.availableNumbers,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      typeof candidate !==
        "number" &&
      typeof candidate !==
        "string"
    ) {
      continue;
    }

    const raw =
      String(candidate).trim();

    if (!raw) {
      continue;
    }

    const n =
      Number(raw);

    if (
      Number.isFinite(n) &&
      n >= 0
    ) {
      return Math.floor(n);
    }
  }

  return 0;
}

/* =========================================================
PROVIDER EXTRACTION
========================================================= */

function extractProviders(
  value: unknown,
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];

  /*
  A provider must have a price on the provider object itself. Do not use
  findPrice() here: findPrice() intentionally searches nested children,
  which is useful for generic price lookup but unsafe for identifying a
  provider. Otherwise a country/service parent can inherit a child server's
  price and be incorrectly returned as a real provider ID.
  */
  function directPrice(node: Record<string, unknown>): number {
    const keys = [
      "cost",
      "price",
      "price_usd",
      "priceUsd",
      "activationCost",
      "activation_cost",
      "minPrice",
      "min_price",
    ];

    for (const key of keys) {
      const candidate = node[key];
      const values = Array.isArray(candidate) ? candidate : [candidate];
      for (const value of values) {
        if (typeof value !== "number" && typeof value !== "string") {
          continue;
        }
        const n = Number(String(value).trim());
        if (Number.isFinite(n) && n > 0) {
          return n;
        }
      }
    }

    return 0;
  }

  function walk(node: unknown, depth = 0, parentKey = "") {
    if (depth > 12 || node === null || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item, depth + 1, parentKey);
      }
      return;
    }

    const obj = node as Record<string, unknown>;
    const direct = directPrice(obj);
    const explicitProviderId = firstNonEmpty(
      obj.provider_id,
      obj.providerId,
      obj.operator_id,
      obj.operatorId,
      obj.provider,
      obj.operator,
    );
    const recordId = firstNonEmpty(obj.id);

    const keyLooksLikeProviderId =
      /^\d+$/.test(parentKey.trim()) ||
      /^(?:provider|operator)[_ -]?\w+$/i.test(parentKey.trim());

    /*
    Some provider rows expose their price inside a nested field, so an
    explicit provider/operator ID may use the recursive price helper. A
    generic `id` or numeric object key is accepted only when the same object
    has a direct price. This prevents country/service IDs from being inferred
    as providers just because a nested server has a price.
    */
    const price = explicitProviderId ? findPrice(obj) : direct;
    const providerId = explicitProviderId || (
      direct > 0
        ? (recordId || (keyLooksLikeProviderId ? parentKey.trim() : ""))
        : ""
    );
    const stockKnown = hasStockInformation(obj);
    const stock = findStock(obj);

    if (
      providerId &&
      price > 0 &&
      (!stockKnown || stock > 0)
    ) {
      result.push({
        ...obj,
        provider_id: String(providerId),
        __grizzly_stock_unknown: !stockKnown,
      });
    }

    for (const [childKey, child] of Object.entries(obj)) {
      if (child && typeof child === "object") {
        walk(child, depth + 1, childKey);
      }
    }
  }

  walk(value);

  const seen = new Set<string>();
  return result.filter((provider) => {
    const id = firstNonEmpty(
      provider.provider_id,
      provider.providerId,
      provider.provider,
      provider.providerIds,
      provider.provider_ids,
      provider.operator_id,
      provider.operatorId,
      provider.operator,
      provider.id,
    );

    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

/* =========================================================
PRICE DATA
========================================================= */

async function getPriceData(
  country?: string,
  service?: string,
) {
  const params:
    Record<string, unknown> = {};

  if (country) {
    params.country =
      resolveCountryCode(
        country,
      );
  }

  if (service) {
    params.service =
      cleanString(service);
  }

  try {
    const v3 = await grizzlyRequest(
      "getPricesV3",
      params,
    );

    // A successful HTTP response can still contain a plain-text Grizzly
    // error or an empty result. Fall back to the legacy endpoint in that case.
    if (
      v3 === null ||
      v3 === undefined ||
      (typeof v3 === "string" && !v3.trim()) ||
      (typeof v3 === "object" && !Array.isArray(v3) && Object.keys(v3 as Record<string, unknown>).length === 0)
    ) {
      throw new Error("Grizzly getPricesV3 returned an empty response.");
    }

    return v3;
  } catch (v3Error) {
    try {
      return await grizzlyRequest(
        "getPrices",
        params,
      );
    } catch (legacyError) {
      throw new Error(
        `Grizzly price lookup failed. getPricesV3: ${v3Error instanceof Error ? v3Error.message : String(v3Error)}; getPrices: ${legacyError instanceof Error ? legacyError.message : String(legacyError)}`,
      );
    }
  }
}

/* =========================================================
COUNTRIES
========================================================= */

async function getCountries() {
  const data =
    await getPriceData();

  const countries:
    Record<string, unknown>[] =
    [];

  const seen =
    new Set<string>();

  function addCountry(
    rawCode: string,
    value: unknown,
  ) {
    if (!rawCode) {
      return;
    }

    const code =
      resolveCountryCode(
        rawCode,
      );

    if (!code) {
      return;
    }

    if (
      seen.has(code)
    ) {
      return;
    }

    const known =
      Boolean(
        COUNTRY_NAMES[code],
      );

    if (!known) {
      return;
    }

    seen.add(code);

    const name =
      countryNameFromAny(
        value,
        code,
      );

    countries.push({
      id: code,
      country_id: code,
      country_key: code,
      code,
      name,
      country_name: name,
    });
  }

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    for (
      const [
        key,
        value,
      ] of Object.entries(
        data as Record<
          string,
          unknown
        >,
      )
    ) {
      addCountry(
        key,
        value,
      );
    }
  }

  for (
    const obj of collectObjects(data)
  ) {
    const code =
      firstNonEmpty(
        obj.country_id,
        obj.countryId,
        obj.country_code,
        obj.countryCode,
      );

    if (code) {
      addCountry(
        code,
        obj,
      );
    }
  }

  countries.sort(
    (a, b) =>
      String(a.name).localeCompare(
        String(b.name),
      ),
  );

  return {
    countries,
  };
}

/* =========================================================
SERVICES
========================================================= */

async function getServices(
  country: string,
) {
  const resolvedCountry =
    resolveCountryCode(
      country,
    );

  const data =
    await getPriceData(
      resolvedCountry,
    );

  const services:
    Record<string, unknown>[] =
    [];

  const seen =
    new Set<string>();

  async function addService(
    code: string,
    value: unknown,
  ) {
    if (!code) {
      return;
    }

    const cleanCode =
      cleanString(code);

    if (!cleanCode) {
      return;
    }

    const key =
      cleanCode.toLowerCase();

    if (
      seen.has(key)
    ) {
      return;
    }

    if (
      COUNTRY_NAMES[
        cleanCode
      ]
    ) {
      return;
    }

    const name =
      await resolveServiceName(
        cleanCode,
        value,
      );

    if (
      !name ||
      name ===
        "[object Object]"
    ) {
      return;
    }

    const availability =
      findServiceAvailability(
        value,
      );

    seen.add(key);

    services.push({
      id: cleanCode,
      code: cleanCode,
      service: cleanCode,
      service_code:
        cleanCode,
      name,
      service_name:
        name,
      title:
        name,
      product:
        cleanCode,
      product_name:
        cleanCode,
      available:
        availability,
      stock:
        availability,
      count:
        availability,
      quantity:
        availability,
    });
  }

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const root =
      data as Record<
        string,
        unknown
      >;

    const countryNode =
      root[
        resolvedCountry
      ];

    if (
      countryNode &&
      typeof countryNode ===
        "object"
    ) {
      for (
        const [
          key,
          value,
        ] of Object.entries(
          countryNode as Record<
            string,
            unknown
          >,
        )
      ) {
        await addService(
          key,
          value,
        );
      }
    }
  }

  for (
    const obj of collectObjects(data)
  ) {
    const code =
      firstNonEmpty(
        obj.service_code,
        obj.serviceCode,
        obj.service,
        obj.product,
        obj.code,
      );

    if (code) {
      await addService(
        code,
        obj,
      );
    }
  }

  services.sort(
    (a, b) =>
      String(
        a.name,
      ).localeCompare(
        String(
          b.name,
        ),
      ),
  );

  return {
    country:
      resolvedCountry,

    country_name:
      countryNameFromAny(
        resolvedCountry,
        resolvedCountry,
      ),

    services,
  };
}

/* =========================================================
SERVERS
========================================================= */

function normalizeServiceKey(value: unknown): string {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}


async function getServers(
  country: string,
  service: string,
) {
  const resolvedCountry =
    resolveCountryCode(
      country,
    );

  const resolvedService =
    cleanString(service);

  const data =
    await getPriceData(
      resolvedCountry,
      resolvedService,
    );

  /*
  Grizzly's getPricesV3/getPrices response can vary in shape between
  services and countries. The request above already includes the exact
  country and service, so recursively extract provider records from that
  filtered response instead of requiring one exact nested JSON shape.
  This avoids falsely reporting every server unavailable when Grizzly
  changes the nesting/key format of its price response.
  */
  const providers = extractProviders(data);

  const countryName =
    countryNameFromAny(
      resolvedCountry,
      resolvedCountry,
    );

  const serverRows:
    Record<string, unknown>[] =
    [];

  for (
    const provider of providers
  ) {
    const providerId =
      firstNonEmpty(
        provider.provider_id,
        provider.providerId,
        provider.provider,
        provider.providerIds,
        provider.provider_ids,
        provider.operator_id,
        provider.operatorId,
        provider.operator,
        provider.id,
      );

    const providerUsd =
      findPrice(provider);

    const stock =
      findStock(provider);
    const stockKnown =
      provider.__grizzly_stock_unknown !== true &&
      hasStockInformation(provider);

    /*
    Only list providers whose current Grizzly price response confirms
    that at least one number is available. A provider with missing stock
    metadata is not advertised as available because that would force the
    customer to select a provider that may immediately reject the order.
    */
    if (
      !providerId ||
      !Number.isFinite(
        providerUsd,
      ) ||
      providerUsd <= 0 ||
      (stockKnown && (!Number.isFinite(stock) || stock <= 0))
    ) {
      continue;
    }

    try {
      const price =
        await calculateCustomerPrice(
          providerUsd,
          resolvedCountry,
          resolvedService,
        );

      serverRows.push({
        raw_provider_id:
          String(providerId),

        provider_id:
          String(providerId),

        operator_id:
          String(providerId),

        operator:
          String(providerId),

        provider_usd:
          Number(providerUsd),

        stock:
          stockKnown ? Number(stock) : null,

        available:
          stockKnown ? Number(stock) : null,

        price_usd:
          Number(providerUsd),

        customer_price_ngn:
          Number(
            price.customer_price_ngn,
          ),

        selling_price_ngn:
          Number(
            price.customer_price_ngn,
          ),

        price_ngn:
          Number(
            price.customer_price_ngn,
          ),

        markup_percent:
          Number(
            price.markup_percent,
          ),

        exchange_rate:
          Number(
            price.exchange_rate,
          ),
      });
    } catch {
      continue;
    }
  }

  serverRows.sort(
    (a, b) =>
      Number(
        a.customer_price_ngn,
      ) -
      Number(
        b.customer_price_ngn,
      ),
  );

  /*
  Return all priced providers that are not explicitly marked out of stock.
  Grizzly price responses do not always include stock metadata, so an
  omitted stock field is treated as unknown and the purchase endpoint is
  allowed to make the final availability decision. Keep the familiar
  Server 1, Server 2 labels; the real provider ID remains in server_id.
  */
  const servers =
    serverRows
      .map(
        (
          row,
          index,
        ) => {
          const label =
            `Server ${index + 1}`;

          return {
            id:
              String(
                row.raw_provider_id,
              ),

            server_id:
              String(
                row.raw_provider_id,
              ),

            provider_id:
              String(
                row.raw_provider_id,
              ),

            operator_id:
              String(
                row.raw_provider_id,
              ),

            name:
              label,

            label,

            server_name:
              label,

            operator_name:
              label,

            raw_provider_id:
              String(
                row.raw_provider_id,
              ),

            provider_usd:
              Number(
                row.provider_usd,
              ),

            stock:
              row.stock === null ? null : Number(row.stock),

            available:
              row.available === null ? null : Number(row.available),

            price_usd:
              Number(
                row.price_usd,
              ),

            customer_price_ngn:
              Number(
                row.customer_price_ngn,
              ),

            selling_price_ngn:
              Number(
                row.selling_price_ngn,
              ),

            price_ngn:
              Number(
                row.price_ngn,
              ),

            markup_percent:
              Number(
                row.markup_percent,
              ),

            exchange_rate:
              Number(
                row.exchange_rate,
              ),
          };
        },
      );

  return {
    country:
      String(resolvedCountry),

    country_id:
      String(resolvedCountry),

    country_name:
      String(countryName),

    service:
      String(resolvedService),

    service_code:
      String(resolvedService),

    service_name:
      String(
        await resolveServiceName(
          resolvedService,
        ),
      ),

    servers,
  };
}

/* =========================================================
AUTH
========================================================= */

async function getUser(
  request: Request,
) {
  const auth =
    request.headers.get(
      "Authorization",
    );

  if (!auth) {
    throw new Error(
      "Authentication required.",
    );
  }

  const token =
    auth
      .replace(
        /^Bearer\s+/i,
        "",
      )
      .trim();

  if (!token) {
    throw new Error(
      "Authentication required.",
    );
  }

  const supabaseUser =
    createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY ||
        SUPABASE_SERVICE_ROLE_KEY,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      },
    );

  const {
    data,
    error,
  } =
    await supabaseUser.auth.getUser(
      token,
    );

  if (
    error ||
    !data?.user
  ) {
    throw new Error(
      "Invalid session.",
    );
  }

  return data.user;
}

/* =========================================================
WALLET
========================================================= */

async function getWalletBalance(
  userId: string,
) {
  const result =
    await supabaseAdmin
      .from("wallet")
      .select("*")
      .eq(
        "user-id",
        userId,
      )
      .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return 0;
  }

  const balance =
    Number(
      result.data.balance ??
        result.data.amount ??
        0,
    );

  return Number.isFinite(balance)
    ? balance
    : 0;
}

/* =========================================================
PROVIDER BALANCE ERROR
========================================================= */

function isProviderBalanceError(
  error: unknown,
): boolean {
  /*
  Only classify explicit provider/API balance codes here. A generic
  database/RPC error containing words such as "balance" or
  "insufficient funds" must not be reported as a Grizzly balance error.
  In particular, the customer-wallet reservation runs after a number
  has been issued and must retain its own real error message.
  */
  const text = String(
    error instanceof Error
      ? error.message
      : error,
  )
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  /*
  Treat only Grizzly's explicit balance-related response codes/phrases as
  provider-balance failures. Do not infer a balance failure from generic
  errors such as "server unavailable", "no numbers", or other API failures.
  */
  return (
    /(^|[^A-Z0-9_])NO_MONEY([^A-Z0-9_]|$)/.test(text) ||
    /(^|[^A-Z0-9_])NO_BALANCE([^A-Z0-9_]|$)/.test(text) ||
    /(^|[^A-Z0-9_])INSUFFICIENT_FUNDS([^A-Z0-9_]|$)/.test(text) ||
    /(^|[^A-Z0-9_])INSUFFICIENT_BALANCE([^A-Z0-9_]|$)/.test(text) ||
    /(^|[^A-Z0-9_])INSUFFICIENT_PROVIDER_FUNDS([^A-Z0-9_]|$)/.test(text) ||
    /(^|[^A-Z0-9_])PROVIDER_INSUFFICIENT_FUNDS([^A-Z0-9_]|$)/.test(text) ||
    /(^|[^A-Z0-9_])NOT_ENOUGH_MONEY([^A-Z0-9_]|$)/.test(text) ||
    /INSUFFICIENT_FUNDS_IN_PROVIDER_BALANCE/.test(text) ||
    /PROVIDER_BALANCE_INSUFFICIENT/.test(text)
  );
}

/* =========================================================
PHONE NUMBER EXTRACTION
========================================================= */

function findPhoneNumber(
  value: unknown,
  depth = 0,
): string {
  if (depth > 10) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const text =
      String(value).trim();

    if (!text) {
      return "";
    }

    const digits =
      text.replace(
        /\D/g,
        "",
      );

    if (
      digits.length >= 7 &&
      digits.length <= 20
    ) {
      return text;
    }

    return "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found =
        findPhoneNumber(
          item,
          depth + 1,
        );

      if (found) {
        return found;
      }
    }

    return "";
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }

  const obj =
    value as Record<
      string,
      unknown
    >;

  const directCandidates = [
    obj.phoneNumber,
    obj.phone_number,
    obj.msisdn,
    obj.number,
    obj.phone,
    obj.tel,
    obj.telephone,
  ];

  for (
    const candidate of directCandidates
  ) {
    const found =
      findPhoneNumber(
        candidate,
        depth + 1,
      );

    if (found) {
      return found;
    }
  }

  for (
    const [
      key,
      child,
    ] of Object.entries(obj)
  ) {
    if (
      key === "activationId" ||
      key === "activation_id" ||
      key === "activationID"
    ) {
      continue;
    }

    if (
      child &&
      typeof child === "object"
    ) {
      const found =
        findPhoneNumber(
          child,
          depth + 1,
        );

      if (found) {
        return found;
      }
    }
  }

  return "";
}

/* =========================================================
EXTRACT GRIZZLY PURCHASE
========================================================= */

function extractGrizzlyPurchase(
  value: unknown,
) {
  const objects =
    collectObjects(value);

  let activationId = "";
  let phoneNumber = "";
  let activationCost = 0;

  /*
  Grizzly sometimes returns a successful purchase as plain text rather
  than JSON: ACCESS_NUMBER:activationId:phoneNumber. Parse that format
  before searching JSON/object responses, otherwise a real purchased
  number can be mistaken for a response with no activation ID.
  */
  if (
    typeof value === "string"
  ) {
    const plainTextMatch =
      value.trim().match(
        /^ACCESS_NUMBER\s*:\s*([^:]+)\s*:\s*(.+)$/i,
      );

    if (plainTextMatch) {
      activationId =
        plainTextMatch[1].trim();
      phoneNumber =
        plainTextMatch[2].trim();
    }
  }

  for (
    const obj of objects
  ) {
    if (!activationId) {
      activationId =
        firstNonEmpty(
          obj.activationId,
          obj.activation_id,
          obj.activationID,
        );
    }

    if (!phoneNumber) {
      phoneNumber =
        findPhoneNumber(
          obj.phoneNumber,
        ) ||
        findPhoneNumber(
          obj.phone_number,
        ) ||
        findPhoneNumber(
          obj.phone,
        ) ||
        findPhoneNumber(
          obj.number,
        ) ||
        findPhoneNumber(
          obj.msisdn,
        );
    }

    if (!activationCost) {
      const candidates = [
        obj.activationCost,
        obj.activation_cost,
        obj.cost,
        obj.price,
      ];

      for (
        const candidate of candidates
      ) {
        const possible =
          findPrice(candidate);

        if (
          Number.isFinite(
            possible,
          ) &&
          possible > 0
        ) {
          activationCost =
            possible;
          break;
        }
      }
    }

    if (
      activationId &&
      phoneNumber
    ) {
      break;
    }
  }

  if (!activationId) {
    for (
      const obj of objects
    ) {
      const candidate =
        obj.activationId ??
        obj.activation_id ??
        obj.activationID;

      if (
        typeof candidate ===
          "string" ||
        typeof candidate ===
          "number"
      ) {
        const text =
          String(candidate).trim();

        if (text) {
          activationId =
            text;
          break;
        }
      }
    }
  }

  if (!phoneNumber) {
    phoneNumber =
      findPhoneNumber(value);
  }

  return {
    activationId:
      String(
        activationId || "",
      ).trim(),

    phoneNumber:
      String(
        phoneNumber || "",
      ).trim(),

    activationCost:
      Number(
        activationCost || 0,
      ),
  };
}

/* =========================================================
BUY NUMBER
========================================================= */

async function buyNumber(
  request: Request,
  body:
    Record<string, unknown>,
) {
  const user =
    await getUser(request);

  const country =
    resolveCountryCode(
      firstNonEmpty(
        body.country,
        body.country_id,
        body.country_key,
      ),
    );

  const service =
    firstNonEmpty(
      body.service,
      body.service_code,
      body.product,
    );

  const requestedProvider =
    firstNonEmpty(
      body.server_id,
      body.operator,
      body.provider_id,
      body.operator_id,
    );

  if (!country) {
    throw new Error(
      "Country is required.",
    );
  }

  if (!service) {
    throw new Error(
      "Service is required.",
    );
  }

  const serverData =
    await getServers(
      country,
      service,
    );

  let selectedServer:
    Record<string, unknown> | undefined =
    serverData.servers.find(
      (
        server:
          Record<
            string,
            unknown
          >,
      ) =>
        String(
          server.server_id,
        ) ===
        String(
          requestedProvider,
        ),
    );

  if (!selectedServer) {
    throw new Error(
      "Selected server is no longer available.",
    );
  }

  let realProviderId =
    String(
      selectedServer.server_id,
    );

  let customerPrice =
    Number(
      selectedServer.customer_price_ngn,
    );

  if (
    !Number.isFinite(
      customerPrice,
    ) ||
    customerPrice <= 0
  ) {
    throw new Error(
      "Number price unavailable.",
    );
  }

  const balance =
    await getWalletBalance(
      user.id,
    );

  if (
    balance < customerPrice
  ) {
    const needed =
      Math.ceil(
        customerPrice -
          balance,
      );

    return {
      ok: false,

      error:
        "INSUFFICIENT_WALLET",

      message:
        `Insufficient wallet balance. Add ₦${needed.toLocaleString()} to continue.`,

      balance:
        Number(balance),

      price:
        Number(customerPrice),

      needed:
        Number(needed),
    };
  }

  let providerResponse:
    unknown;

  /*
  Purchase only from the server the customer selected. If that server
  has run out of numbers since the server list was loaded, return the
  clear unavailable-server message instead of silently buying from a
  different server.
  */
  const purchaseCandidates:
    Record<string, unknown>[] =
    [selectedServer];

  let purchasedServer:
    Record<string, unknown> | null =
    null;

  let lastNoNumbersMessage =
    "NO_NUMBERS";

  for (
    const candidate of purchaseCandidates
  ) {
    const candidateProviderId =
      String(
        candidate.server_id,
      );

    const candidatePrice =
      Number(
        candidate.customer_price_ngn,
      );

    if (
      !candidateProviderId ||
      !Number.isFinite(
        candidatePrice,
      ) ||
      candidatePrice <= 0
    ) {
      continue;
    }

    /*
    If a fallback server costs more than the customer's
    current wallet balance, do not attempt that provider.
    A later provider may still be affordable.
    */
    if (
      balance < candidatePrice
    ) {
      continue;
    }

    try {
      const candidateResponse =
        await grizzlyRequest(
          "getNumberV2",
          {
            service,
            country,
            providerIds:
              candidateProviderId,
          },
        );

      providerResponse =
        candidateResponse;

      selectedServer =
        candidate;

      realProviderId =
        candidateProviderId;

      customerPrice =
        candidatePrice;

      purchasedServer =
        candidate;

      break;
    } catch (error) {
      const providerMessage =
        error instanceof Error
          ? error.message
          : String(error);

      const normalizedProviderMessage =
        providerMessage
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, "_");

      /*
      Availability errors must be handled before balance errors. If a
      Grizzly response contains both kinds of wording, an explicit
      no-number/provider-unavailable code takes precedence so the user
      is told to choose another currently available provider instead of
      being incorrectly told that Grizzly has insufficient funds.
      */
      const providerUnavailable =
        normalizedProviderMessage.includes("NO_NUMBERS") ||
        normalizedProviderMessage.includes("NO_ACTIVATION") ||
        normalizedProviderMessage.includes("NO_AVAILABLE_NUMBER") ||
        normalizedProviderMessage.includes("NO_NUMBER") ||
        normalizedProviderMessage.includes("SERVER_NOT_AVAILABLE") ||
        normalizedProviderMessage.includes("SERVER_UNAVAILABLE") ||
        normalizedProviderMessage.includes("SERVER_IS_NOT_AVAILABLE") ||
        normalizedProviderMessage.includes("PROVIDER_NOT_AVAILABLE") ||
        normalizedProviderMessage.includes("PROVIDER_UNAVAILABLE") ||
        normalizedProviderMessage.includes("PROVIDER_IS_NOT_AVAILABLE") ||
        normalizedProviderMessage.includes("NO_STOCK") ||
        normalizedProviderMessage.includes("OUT_OF_STOCK") ||
        normalizedProviderMessage.includes("OUT_OF_SERVICE") ||
        normalizedProviderMessage.includes("NOT_AVAILABLE") ||
        normalizedProviderMessage.includes("NOTAVAILABLE") ||
        normalizedProviderMessage.includes("UNAVAILABLE") ||
        normalizedProviderMessage.includes("NO_AVAILABLE_NUMBERS") ||
        normalizedProviderMessage.includes("NUMBERS_NOT_AVAILABLE") ||
        normalizedProviderMessage.includes("NO_ACTIVATION_AVAILABLE") ||
        normalizedProviderMessage.includes("NO_ACTIVATIONS_AVAILABLE") ||
        normalizedProviderMessage.includes("TRY_ANOTHER_SERVER") ||
        normalizedProviderMessage.includes("SERVER_HAS_NO_NUMBERS") ||
        normalizedProviderMessage.includes("SERVER_HAS_NO_STOCK") ||
        /\b(?:SERVER|PROVIDER)\s+(?:IS\s+)?(?:NOT\s+AVAILABLE|UNAVAILABLE)\b/i.test(providerMessage) ||
        /\b(?:NO|NOT ENOUGH|INSUFFICIENT)\s+(?:AVAILABLE\s+)?(?:NUMBERS?|ACTIVATIONS?|STOCK)\b/i.test(providerMessage) ||
        /\b(?:OUT OF STOCK|TRY ANOTHER SERVER)\b/i.test(providerMessage);

      if (providerUnavailable) {
        lastNoNumbersMessage = providerMessage;
        continue;
      }

      if (
        isProviderBalanceError(
          error,
        )
      ) {
        return {
          ok: false,

          error:
            "PROVIDER_BALANCE",

          message:
            "Insufficient fund, please contact support.",
        };
      }

      throw new Error(providerMessage);
    }
  }

  if (
    !purchasedServer ||
    !providerResponse
  ) {
    const serverLabel =
      firstNonEmpty(
        selectedServer.server_name,
        selectedServer.name,
        "Selected server",
      );

    return {
      ok: false,

      error:
        "NO_NUMBERS",

      server_id:
        String(
          realProviderId,
        ),

      server_name:
        String(
          serverLabel,
        ),

      message:
        "Server not available right now. Please try another server.",

      provider_message:
        lastNoNumbersMessage,
    };
  }

  const purchase =
    extractGrizzlyPurchase(
      providerResponse,
    );

  const activationId =
    purchase.activationId;

  const phoneNumber =
    purchase.phoneNumber;

  const providerCostUsd =
    purchase.activationCost ||
    Number(
      selectedServer.provider_usd,
    );

  if (!activationId) {
    console.error(
      "Grizzly purchase response missing activationId:",
      JSON.stringify(
        providerResponse,
      ),
    );

    throw new Error(
      "Grizzly returned a number purchase without an activation ID.",
    );
  }

  if (!phoneNumber) {
    console.error(
      "Grizzly purchase response missing phoneNumber:",
      JSON.stringify(
        providerResponse,
      ),
    );

    try {
      await grizzlyRequest(
        "setStatus",
        {
          id:
            activationId,

          status: 8,
        },
      );
    } catch (cancelError) {
      console.error(
        "Failed to cancel activation after missing phone:",
        cancelError,
      );
    }

    throw new Error(
      "Grizzly issued an activation but did not return a valid phone number.",
    );
  }

  /* =======================================================
  SAVE ACTIVATION + RESERVE CUSTOMER WALLET
  ======================================================= */

  const reserve =
    await supabaseAdmin.rpc(
      "reserve_grizzly_virtual_number",
      {
        p_user_id:
          user.id,

        p_amount:
          customerPrice,

        p_activation_id:
          String(
            activationId,
          ),

        p_phone_number:
          String(
            phoneNumber,
          ),

        p_country:
          String(
            country,
          ),

        p_service:
          String(
            service,
          ),

        p_provider:
          String(
            realProviderId,
          ),
      },
    );

  if (reserve.error) {
    try {
      await grizzlyRequest(
        "setStatus",
        {
          id:
            String(
              activationId,
            ),

          status: 8,
        },
      );
    } catch (cancelError) {
      console.error(
        "Failed to cancel Grizzly activation after reservation failure:",
        cancelError,
      );
    }

    throw reserve.error;
  }

  const serverLabel =
    firstNonEmpty(
      selectedServer.server_name,
      selectedServer.name,
      "Server 1",
    );

  const serviceDisplay =
    await resolveServiceName(
      service,
    );

  const countryDisplay =
    countryNameFromAny(
      country,
      country,
    );

  return {
    ok: true,

    success: true,

    message:
      "Number successfully purchased.",

    activation_id:
      String(
        activationId,
      ),

    activationId:
      String(
        activationId,
      ),

    phone_number:
      String(
        phoneNumber,
      ),

    phoneNumber:
      String(
        phoneNumber,
      ),

    number:
      String(
        phoneNumber,
      ),

    country:
      String(
        country,
      ),

    country_id:
      String(
        country,
      ),

    country_name:
      String(
        countryDisplay,
      ),

    service:
      String(
        service,
      ),

    service_code:
      String(
        service,
      ),

    service_name:
      String(
        serviceDisplay,
      ),

    server_id:
      String(
        realProviderId,
      ),

    provider_id:
      String(
        realProviderId,
      ),

    server_name:
      String(
        serverLabel,
      ),

    server_label:
      String(
        serverLabel,
      ),

    operator:
      String(
        serverLabel,
      ),

    price:
      Number(
        customerPrice,
      ),

    customer_price_ngn:
      Number(
        customerPrice,
      ),

    provider_usd:
      Number(
        providerCostUsd,
      ),

    status:
      "waiting",

    otp_code:
      null,

    sms_code:
      null,

    sms_text:
      null,

    code:
      null,

    text:
      null,
  };
}

/* =========================================================
ORDERS
========================================================= */

async function getOrders(
  request: Request,
) {
  const user =
    await getUser(request);

  const result =
    await supabaseAdmin
      .from(
        "virtual_number_orders",
      )
      .select("*")
      .eq(
        "user_id",
        user.id,
      );

  if (result.error) {
    const ordersError = result.error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const readableMessage = firstNonEmpty(
      ordersError.message,
      ordersError.details,
      ordersError.hint,
      ordersError.code,
    );

    throw new Error(
      readableMessage ||
        "Unable to load orders from the database.",
    );
  }

  const serviceCatalog =
    await loadServiceCatalog();

  const orders =
    await Promise.all(
      (result.data ?? []).map(
      async (
        row:
          Record<
            string,
            unknown
          >,
      ) => {
        /*
        GRIZZLY ACTIVATION FIX:

        The Grizzly reservation RPC stores
        the activation ID inside numpool_order_id
        as:

        grizzly:<activation_id>

        Keep the existing activation columns
        as the first priority, then recover the
        activation ID from the Grizzly order ID.
        */

        let activationId =
          firstNonEmpty(
            row.activation_id,
            row.activationId,
            row.provider_activation_id,
            row.providerActivationId,
          );

        if (
          !activationId
        ) {
          const numpoolOrderId =
            cleanString(
              row.numpool_order_id,
            );

          if (
            numpoolOrderId
              .toLowerCase()
              .startsWith(
                "grizzly:",
              )
          ) {
            activationId =
              numpoolOrderId
                .slice(
                  "grizzly:".length,
                )
                .trim();
          }
        }

        const phoneNumber =
          findPhoneNumber(
            row.phone_number,
          ) ||
          findPhoneNumber(
            row.phoneNumber,
          ) ||
          findPhoneNumber(
            row.number,
          ) ||
          findPhoneNumber(
            row.phone,
          ) ||
          findPhoneNumber(
            row.msisdn,
          );

        const country =
          firstNonEmpty(
            row.country,
            row.country_id,
            row.country_key,
          );

        const service =
          firstNonEmpty(
            row.service,
            row.service_code,
            row.product,
          );

        const status =
          firstNonEmpty(
            row.status,
            row.state,
          ) || "waiting";

        const priceRaw =
          firstNonEmpty(
            row.price,
            row.customer_price_ngn,
            row.amount,
          );

        const price =
          Number(priceRaw);

        const providerId =
          firstNonEmpty(
            row.provider_id,
            row.provider,
            row.server_id,
          );

        const serverId =
          firstNonEmpty(
            row.server_id,
            row.provider_id,
            row.provider,
          );

        const serverName =
          firstNonEmpty(
            row.server_name,
            row.server_label,
            row.operator,
          );

        const countryName =
          countryNameFromAny(
            firstNonEmpty(
              row.country_name,
              row.countryName,
              country,
            ),
            country,
          );

        const rawServiceName =
          firstNonEmpty(
            row.service_name,
            row.serviceName,
            row.full_service_name,
            row.fullServiceName,
          );

        const serviceName =
          rawServiceName &&
          !/^\\d+$/.test(rawServiceName)
            ? rawServiceName
            : serviceCatalog[service] ??
              serviceCatalog[service.toLowerCase()] ??
              serviceNameFromObject(
                service,
                service,
              );

        const otpCode =
          firstNonEmpty(
            row.otp_code,
            row.sms_code,
            row.code,
          );

        const smsText =
          firstNonEmpty(
            row.sms_text,
            row.text,
          );

        return {
          id:
            cleanString(
              row.id,
            ),

          order_id:
            cleanString(
              row.id,
            ),

          activation_id:
            activationId,

          activationId:
            activationId,

          phone_number:
            phoneNumber,

          phoneNumber:
            phoneNumber,

          number:
            phoneNumber,

          country:
            countryName,

          country_id:
            country,

          country_name:
            countryName,

          service:
            serviceName,

          service_code:
            service,

          service_name:
            serviceName,

          provider_id:
            providerId,

          server_id:
            serverId,

          server_name:
            serverName,

          server_label:
            serverName,

          operator:
            serverName,

          price:
            Number.isFinite(
              price,
            )
              ? price
              : 0,

          customer_price_ngn:
            Number.isFinite(
              price,
            )
              ? price
              : 0,

          status:
            status,

          otp_code:
            otpCode ||
            null,

          sms_code:
            otpCode ||
            null,

          code:
            otpCode ||
            null,

          sms_text:
            smsText ||
            null,

          text:
            smsText ||
            null,

          created_at:
            cleanString(
              row.created_at,
            ),

          updated_at:
            cleanString(
              row.updated_at,
            ),

          purchased_at:
            cleanString(
              row.purchased_at,
            ),
        };
      },
      ),
    );

  orders.sort(
    (
      a:
        Record<
          string,
          unknown
        >,
      b:
        Record<
          string,
          unknown
        >,
    ) => {
      const aTime =
        new Date(
          firstNonEmpty(
            a.created_at,
            a.updated_at,
            a.purchased_at,
          ),
        ).getTime() || 0;

      const bTime =
        new Date(
          firstNonEmpty(
            b.created_at,
            b.updated_at,
            b.purchased_at,
          ),
        ).getTime() || 0;

      return bTime - aTime;
    },
  );

  return {
    ok: true,

    success: true,

    orders,

    data:
      orders,
  };
}

/* =========================================================
NORMALIZE GRIZZLY STATUS
========================================================= */

function normalizeGrizzlyStatus(
  result: unknown,
  activationId: string,
) {
  const rawText =
    cleanString(result);

  // Grizzly may return the live SMS code as STATUS_OK:<code>.
  const statusOkMatch = rawText.match(/^STATUS_OK\s*:\s*(.+)$/i);
  const statusOkCode = statusOkMatch?.[1]?.trim() ?? "";

  const resultObj =
    result &&
    typeof result === "object"
      ? result as Record<
          string,
          unknown
        >
      : {};

  const sms =
    resultObj.sms &&
    typeof resultObj.sms ===
      "object"
      ? smsObject(
          resultObj.sms,
        )
      : null;

  const code =
    firstNonEmpty(
      sms?.code,
      statusOkCode,
      resultObj.code,
      resultObj.sms_code,
      resultObj.smsCode,
    );

  const text =
    firstNonEmpty(
      sms?.text,
      resultObj.text,
      resultObj.sms_text,
      resultObj.smsText,
    );

  const dateTime =
    firstNonEmpty(
      sms?.dateTime,
      sms?.datetime,
      resultObj.dateTime,
      resultObj.datetime,
    );

  let status =
    "waiting";

  if (code) {
    status =
      "received";
  } else if (
    rawText ===
      "STATUS_CANCEL" ||
    rawText ===
      "CANCEL"
  ) {
    status =
      "cancelled";
  } else if (
    rawText ===
      "STATUS_FINISH" ||
    rawText ===
      "STATUS_OK" ||
    rawText ===
      "FINISH"
  ) {
    status =
      "completed";
  } else if (
    rawText ===
      "STATUS_WAIT_CODE" ||
    rawText ===
      "STATUS_WAIT_RETRY" ||
    rawText ===
      "STATUS_WAIT_RESEND"
  ) {
    status =
      "waiting";
  } else if (
    rawText
  ) {
    const lower =
      rawText.toLowerCase();

    if (
      lower.includes(
        "cancel",
      )
    ) {
      status =
        "cancelled";
    } else if (
      lower.includes(
        "finish",
      ) ||
      lower.includes(
        "completed",
      )
    ) {
      status =
        "completed";
    } else if (
      lower.includes(
        "wait",
      )
    ) {
      status =
        "waiting";
    }
  }

  return {
    ok: true,

    success: true,

    activation_id:
      String(
        activationId,
      ),

    activationId:
      String(
        activationId,
      ),

    status,

    otp_code:
      code || null,

    sms_code:
      code || null,

    code:
      code || null,

    sms_text:
      text || null,

    text:
      text || null,

    sms_date_time:
      dateTime || null,

    message:
      text ||
      code ||
      (
        rawText &&
        rawText !==
          "[object Object]"
          ? rawText
          : null
      ),
  };
}

/* =========================================================
SMALL STATUS OBJECT HELPER
========================================================= */

function smsObject(
  value: unknown,
): Record<string, unknown> | null {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return null;
}

/* =========================================================
ACTIVATION ID EXTRACTION FROM AN ORDER
========================================================= */

/*

GRIZZLY ACTIVATION FIX:

The activation ID can be stored in the
normal activation_id fields.

For Grizzly reservations, the new RPC stores
it inside:

numpool_order_id = "grizzly:<activation_id>"

This helper now checks both the normal
activation-ID fields and the Grizzly
numpool_order_id format.

It still does NOT treat random numeric fields
such as order IDs, prices, timestamps, or phone
numbers as activation IDs.
*/

function findActivationIdInOrder(
  order: unknown,
): string {
  if (
    !order ||
    typeof order !== "object"
  ) {
    return "";
  }

  const objects =
    collectObjects(order);

  const activationKeys = [
    "activation_id",
    "activationId",
    "activationID",
    "provider_activation_id",
    "providerActivationId",
    "grizzly_activation_id",
    "grizzlyActivationId",
  ];

  for (
    const obj of objects
  ) {
    for (
      const key of activationKeys
    ) {
      const value =
        obj[key];

      if (
        typeof value ===
          "string" ||
        typeof value ===
          "number"
      ) {
        const activationId =
          String(value).trim();

        if (activationId) {
          return activationId;
        }
      }
    }
  }

  /*
  GRIZZLY ACTIVATION FIX:

  Recover the activation ID from:

  numpool_order_id = grizzly:<activation_id>
  */

  for (
    const obj of objects
  ) {
    const numpoolOrderId =
      cleanString(
        obj.numpool_order_id,
      );

    if (
      numpoolOrderId
        .toLowerCase()
        .startsWith(
          "grizzly:",
        )
    ) {
      const activationId =
        numpoolOrderId
          .slice(
            "grizzly:".length,
          )
          .trim();

      if (activationId) {
        return activationId;
      }
    }
  }

  return "";
}

/* =========================================================
RESOLVE USER ACTIVATION
========================================================= */

async function resolveUserActivation(
  request: Request,
  body:
    Record<string, unknown>,
) {
  const user =
    await getUser(request);

  const directActivation =
    firstNonEmpty(
      body.activation_id,
      body.activationId,
    );

  const orderId =
    firstNonEmpty(
      body.order_id,
      body.orderId,
    );

  /*
  If the frontend already supplied the
  activation ID, verify that the activation
  belongs to this user's order.

  We intentionally fetch the user's orders
  and inspect them recursively instead of
  requiring activation_id to exist only
  as a top-level database column.
  */

  if (directActivation) {
    const result =
      await supabaseAdmin
        .from(
          "virtual_number_orders",
        )
        .select("*")
        .eq(
          "user_id",
          user.id,
        );

    if (
      result.error
    ) {
      throw result.error;
    }

    const matchingOrder =
      (result.data ?? []).find(
        (
          row:
            Record<
              string,
              unknown
            >,
        ) =>
          findActivationIdInOrder(
            row,
          ) ===
          directActivation,
      );

    if (!matchingOrder) {
      throw new Error(
        "Activation not found for this account.",
      );
    }

    return {
      user,

      activationId:
        directActivation,

      order:
        matchingOrder,
    };
  }

  if (!orderId) {
    throw new Error(
      "Activation ID or order ID is required.",
    );
  }

  const result =
    await supabaseAdmin
      .from(
        "virtual_number_orders",
      )
      .select("*")
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "id",
        orderId,
      )
      .maybeSingle();

  if (
    result.error
  ) {
    throw result.error;
  }

  if (!result.data) {
    throw new Error(
      "Order not found.",
    );
  }

  /*
  GRIZZLY ACTIVATION FIX:

  Search the complete order object,
  including numpool_order_id where the new
  Grizzly reservation RPC stores:

  grizzly:<activation_id>
  */

  const activationId =
    findActivationIdInOrder(
      result.data,
    );

  if (!activationId) {
    console.error(
      "Grizzly order found but activation ID could not be resolved:",
      JSON.stringify(
        {
          order_id:
            cleanString(
              result.data.id,
            ),

          user_id:
            user.id,

          available_keys:
            Object.keys(
              result.data,
            ),
        },
      ),
    );

    throw new Error(
      "Activation ID not found for this order.",
    );
  }

  return {
    user,

    activationId,

    order:
      result.data,
  };
}

/* =========================================================
PERSIST GRIZZLY STATUS
========================================================= */

async function persistGrizzlyStatus(
  userId: string,
  activationId: string,
  statusResult: Record<string, unknown>,
) {
  const status = cleanString(statusResult.status).toLowerCase();
  const code = firstNonEmpty(statusResult.otp_code, statusResult.sms_code, statusResult.code);
  const smsText = firstNonEmpty(statusResult.sms_text, statusResult.text);

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (code) {
    update.status = "completed";
    update.otp_code = code;
    update.sms_code = code;
    update.code = code;
    if (smsText) {
      update.sms_text = smsText;
      update.text = smsText;
    }
  } else if (status === "cancelled") {
    update.status = "cancelled";
  } else if (status === "completed") {
    update.status = "completed";
  } else if (status === "waiting" || status === "received") {
    update.status = status === "received" ? "completed" : "waiting";
  }

  if (!update.status && !code) return;

  const result = await supabaseAdmin
    .from("virtual_number_orders")
    .update(update)
    .eq("user_id", userId)
    .or(`activation_id.eq.${activationId},numpool_order_id.eq.grizzly:${activationId}`);

  if (result.error) {
    // Some installations store activation IDs only in one of the
    // columns above; try a second direct match before reporting failure.
    const fallback = await supabaseAdmin
      .from("virtual_number_orders")
      .update(update)
      .eq("user_id", userId)
      .eq("numpool_order_id", `grizzly:${activationId}`);
    if (fallback.error) {
      console.error("Unable to persist Grizzly status:", result.error.message, fallback.error.message);
    }
  }
}

/* =========================================================
CHECK STATUS
========================================================= */

async function getStatus(
  request: Request,
  body:
    Record<string, unknown>,
) {
  const {
    activationId,
  } =
    await resolveUserActivation(
      request,
      body,
    );

  const result =
    await grizzlyRequest(
      "getStatusV2",
      {
        id:
          activationId,
      },
    );

  const normalized = normalizeGrizzlyStatus(
    result,
    activationId,
  );

  await persistGrizzlyStatus(
    (await getUser(request)).id,
    activationId,
    normalized,
  );

  return normalized;
}

/* =========================================================
CANCEL
========================================================= */

function grizzlyErrorMessage(
  value: unknown,
): string {
  if (value instanceof Error) {
    return (
      value.message ||
      "Grizzly cancellation failed."
    );
  }

  if (typeof value === "string") {
    const text =
      value.trim();

    return (
      text ||
      "Grizzly cancellation failed."
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const obj =
      value as Record<
        string,
        unknown
      >;

    const candidates = [
      obj.error,
      obj.errors,
      obj.message,
      obj.msg,
      obj.description,
      obj.response,
      obj.result,
      obj.status,
      obj.code,
    ];

    for (
      const candidate of candidates
    ) {
      if (
        candidate === undefined ||
        candidate === null
      ) {
        continue;
      }

      if (
        typeof candidate === "object"
      ) {
        const nested =
          grizzlyErrorMessage(
            candidate,
          );

        if (
          nested &&
          nested !==
            "Grizzly cancellation failed."
        ) {
          return nested;
        }

        continue;
      }

      const text =
        String(candidate).trim();

      if (text) {
        return text;
      }
    }

    try {
      const serialized =
        JSON.stringify(value);

      if (
        serialized &&
        serialized !== "{}"
      ) {
        return serialized;
      }
    } catch {
      // Use the safe message below.
    }
  }

  return "Grizzly cancellation failed.";
}

function validateGrizzlyCancellationResponse(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    throw new Error(
      "Grizzly cancellation failed: empty response from Grizzly.",
    );
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    const text =
      String(value).trim();

    const normalized =
      text.toUpperCase();

    const successValues = [
      "ACCESS_CANCEL",
      "STATUS_CANCEL",
      "CANCEL",
      "OK",
      "SUCCESS",
    ];

    if (
      successValues.includes(
        normalized,
      )
    ) {
      return;
    }

    const failureValues = [
      "BAD_KEY",
      "NO_ACTIVATION",
      "BAD_STATUS",
      "ERROR",
      "NO_NUMBERS",
    ];

    if (
      failureValues.includes(
        normalized,
      ) ||
      normalized.startsWith(
        "ERROR",
      ) ||
      normalized.startsWith(
        "BAD_",
      ) ||
      normalized.startsWith(
        "NO_",
      )
    ) {
      throw new Error(
        `Grizzly cancellation failed: ${text}`,
      );
    }

    /*
    Unknown plain responses are allowed here because
    Grizzly has returned different success formats
    across API versions. They are never converted to
    [object Object].
    */
    return;
  }

  if (
    Array.isArray(value)
  ) {
    throw new Error(
      `Grizzly cancellation failed: ${grizzlyErrorMessage(value)}`,
    );
  }

  const obj =
    value as Record<
      string,
      unknown
    >;

  /*
  Explicit error fields always mean cancellation failed.
  */
  const explicitError =
    obj.error ??
    obj.errors ??
    obj.exception;

  if (
    explicitError !== undefined &&
    explicitError !== null &&
    String(explicitError).trim() !== ""
  ) {
    throw new Error(
      `Grizzly cancellation failed: ${grizzlyErrorMessage(explicitError)}`,
    );
  }

  const status =
    firstNonEmpty(
      obj.status,
      obj.result,
      obj.response,
      obj.code,
      obj.message,
    ).toUpperCase();

  const successValues = [
    "ACCESS_CANCEL",
    "STATUS_CANCEL",
    "CANCEL",
    "OK",
    "SUCCESS",
  ];

  if (
    successValues.includes(status)
  ) {
    return;
  }

  if (
    status.startsWith("BAD_") ||
    status.startsWith("NO_") ||
    status.startsWith("ERROR")
  ) {
    throw new Error(
      `Grizzly cancellation failed: ${grizzlyErrorMessage(value)}`,
    );
  }

  /*
  Some Grizzly responses may wrap the actual result in
  another object. Check common nested response fields
  before treating the response as successful.
  */
  for (
    const key of [
      "data",
      "response",
      "result",
    ]
  ) {
    const nested =
      obj[key];

    if (
      nested &&
      typeof nested === "object" &&
      !Array.isArray(nested)
    ) {
      validateGrizzlyCancellationResponse(
        nested,
      );

      return;
    }
  }

  /*
  No explicit failure was returned, so allow the
  cancellation to continue to the existing refund RPC.
  */
}

async function cancelNumber(
  request: Request,
  body:
    Record<string, unknown>,
) {
  const {
    user,
    activationId,
    order,
  } =
    await resolveUserActivation(
      request,
      body,
    );

  let providerResult: unknown;

  try {
    providerResult =
      await grizzlyRequest(
        "setStatus",
        {
          id:
            String(
              activationId,
            ),

          status: 8,
        },
      );

    validateGrizzlyCancellationResponse(
      providerResult,
    );
  } catch (error) {
    throw new Error(
      grizzlyErrorMessage(
        error,
      ),
    );
  }

  const refund =
    await supabaseAdmin.rpc(
      "cancel_virtual_number_and_refund",
      {
        p_user_id:
          user.id,

        p_activation_id:
          String(
            activationId,
          ),
      },
    );

  if (refund.error) {
    // Never credit the wallet directly after an RPC error: the RPC may have
    // committed before a network timeout. Retrying through the single
    // idempotent database refund function is the only safe refund path.
    throw new Error(
      `Refund failed after Grizzly cancellation: ${grizzlyErrorMessage(refund.error)}`,
    );
  }

  const cancelledOrderUpdate = await supabaseAdmin
    .from("virtual_number_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("id", String(order.id));

  if (cancelledOrderUpdate.error) {
    console.error("Unable to persist cancelled Grizzly order status:", cancelledOrderUpdate.error.message);
  }

  return {
    ok: true,

    success: true,

    activation_id:
      String(
        activationId,
      ),

    activationId:
      String(
        activationId,
      ),

    status: "cancelled",

    message:
      "Number cancelled and refund processed.",

    provider_ok: true,
  };
}

/* =========================================================
ACTION ROUTER
========================================================= */

async function handle(
  request: Request,
  body:
    Record<string, unknown>,
) {
  const action =
    firstNonEmpty(
      body.action,
      body.type,
    ).toLowerCase();

  switch (action) {
    case "countries":
    case "getcountries":
      return await getCountries();

    case "services":
    case "getservices":
      return await getServices(
        firstNonEmpty(
          body.country,
          body.country_id,
          body.country_key,
        ),
      );

    case "servers":
    case "providers":
    case "getservers":
    case "getproviders":
      return await getServers(
        firstNonEmpty(
          body.country,
          body.country_id,
          body.country_key,
        ),

        firstNonEmpty(
          body.service,
          body.service_code,
          body.product,
        ),
      );

    case "markup_rules":
    case "get_markup_rules":
    case "list_markup_rules":
      return await listMarkupRules(
        request,
      );

    case "save_markup_rule":
    case "upsert_markup_rule":
      return await saveMarkupRule(
        request,
        body,
      );

    case "delete_markup_rule":
      return await deleteMarkupRule(
        request,
        body,
      );

    case "buy":
    case "buynumber":
    case "purchase":
    case "purchasenumber":
      return await buyNumber(
        request,
        body,
      );

    case "orders":
    case "getorders":
    case "listorders":
      return await getOrders(
        request,
      );

    case "status":
    case "getstatus":
    case "check":
    case "checkstatus":
      return await getStatus(
        request,
        body,
      );

    case "cancel":
    case "cancelnumber":
    case "refund":
      return await cancelNumber(
        request,
        body,
      );

    default:
      throw new Error(
        `Unknown action: ${action}`,
      );
  }
}

/* =========================================================
HTTP ENTRY
========================================================= */

Deno.serve(
  async (request) => {
    try {
      if (
        request.method ===
        "OPTIONS"
      ) {
        return new Response(
          "ok",
          {
            headers:
              corsHeaders,
          },
        );
      }

      if (
        request.method !==
        "POST"
      ) {
        return json(
          {
            ok: false,
            error:
              "POST required.",
          },
          405,
        );
      }

      let body:
        Record<
          string,
          unknown
        >;

      try {
        body =
          await request.json();
      } catch {
        return json(
          {
            ok: false,
            error:
              "Invalid JSON.",
          },
          400,
        );
      }

      const result =
        await handle(
          request,
          body,
        );

      return json(
        result,
        200,
      );
    } catch (error) {
      console.error(
        "grizzly-api error:",
        error,
      );

      const message =
        String(
          error instanceof Error
            ? error.message
            : error,
        );

      /*
      Provider-balance errors are translated inside the Grizzly purchase
      request handler, where we know the error came from Grizzly itself.
      Do not reclassify unrelated Supabase/RPC errors as provider balance
      failures here; return their actual message for accurate diagnosis.
      */
      return json(
        {
          ok: false,

          error:
            message,

          message:
            message,
        },
        400,
      );
    }
  },
);