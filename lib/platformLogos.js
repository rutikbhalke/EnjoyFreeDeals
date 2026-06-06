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
  snapdeal: "https://i3.sdlcdn.com/img/snapdeal/darwin/logo/sdLatestLogo.svg"
};

function getPlatformLogo(platform) {
  const key = String(platform || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return PLATFORM_LOGOS[key] || DEFAULT_LOGO_URL;
}

module.exports = { DEFAULT_LOGO_URL, PLATFORM_LOGOS, getPlatformLogo };
