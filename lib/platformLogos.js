const DEFAULT_LOGO_URL = "https://enjoyfreedeals.vercel.app/logo.png";

const PLATFORM_LOGOS = {
  amazon: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  flipkart: "https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg",
  meesho: "https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png",
  myntra: "https://constant.myntassets.com/web/assets/img/MyntraWebSprite_27_01_2021.png",
  ajio: "https://assets.ajio.com/static/img/Ajio-Logo.svg",
  tatacliq: "https://www.tatacliq.com/src/general/components/img/group.svg",
  croma: "https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1664415872/Croma%20Assets/CMS/Homepage%20Banners/Croma_logo_hqvdqv.svg",
  nykaa: "https://www.nykaa.com/assets/desktop/images/header/nykaa-logo.svg",
  snapdeal: "https://i3.sdlcdn.com/img/snapdeal/darwin/logo/sdLatestLogo.svg",
  shopsy: "https://logo.clearbit.com/shopsy.in",
  reliancedigital: "https://logo.clearbit.com/reliancedigital.in",
  vijaysales: "https://logo.clearbit.com/vijaysales.com",
  jiomart: "https://logo.clearbit.com/jiomart.com",
  bigbasket: "https://logo.clearbit.com/bigbasket.com",
  blinkit: "https://logo.clearbit.com/blinkit.com",
  zepto: "https://logo.clearbit.com/zeptonow.com",
  swiggyinstamart: "https://logo.clearbit.com/swiggy.com",
  firstcry: "https://logo.clearbit.com/firstcry.com",
  mamaearth: "https://logo.clearbit.com/mamaearth.in",
  purplle: "https://logo.clearbit.com/purplle.com",
  boat: "https://logo.clearbit.com/boat-lifestyle.com",
  noise: "https://logo.clearbit.com/gonoise.com",
  samsung: "https://logo.clearbit.com/samsung.com",
  apple: "https://logo.clearbit.com/apple.com",
  oneplus: "https://logo.clearbit.com/oneplus.in",
  realme: "https://logo.clearbit.com/realme.com",
  mi: "https://logo.clearbit.com/mi.com",
  adidas: "https://logo.clearbit.com/adidas.co.in",
  nike: "https://logo.clearbit.com/nike.com",
  puma: "https://logo.clearbit.com/puma.com",
  decathlon: "https://logo.clearbit.com/decathlon.in",
  paytm: "https://logo.clearbit.com/paytm.com",
  phonepe: "https://logo.clearbit.com/phonepe.com",
  freecharge: "https://logo.clearbit.com/freecharge.in"
};

function getPlatformLogo(platform) {
  const key = String(platform || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return PLATFORM_LOGOS[key] || DEFAULT_LOGO_URL;
}

module.exports = { DEFAULT_LOGO_URL, PLATFORM_LOGOS, getPlatformLogo };
