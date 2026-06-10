const CATEGORY_RULES = [
  ["Free Samples", /\b(free sample|sample free|freebie|freebies|free product|free trial)\b/i],
  ["Recharge Offers", /\b(recharge|mobile recharge|dth|prepaid|postpaid|data pack|talktime)\b/i],
  ["Bank Offers", /\b(bank offer|credit card|debit card|cashback|emi|upi|card offer|no cost emi)\b/i],
  ["Student Deals", /\b(student|laptop offer|course|education|exam|study|notes|learning)\b/i],
  ["Festival Deals", /\b(diwali|holi|christmas|festival|sale|dhamaka|big billion|great indian festival|baisakhi|eid)\b/i],
  ["Coupons", /\b(coupon|promo code|voucher|discount code|use code|apply code)\b/i],
  ["Mobiles", /\b(mobile|smartphone|phone|iphone|android|samsung|oneplus|realme|redmi|oppo|vivo|poco|xiaomi)\b/i],
  ["Footwear", /\b(shoes|shoe|sandals|slippers|sneakers|boots|footwear|crocs)\b/i],
  ["Watches", /\b(watch|smart watch|smartwatch|analog watch|digital watch)\b/i],
  ["Bags", /\b(bag|backpack|handbag|luggage|trolley|wallet|purse)\b/i],
  ["Beauty", /\b(cream|face wash|serum|lipstick|makeup|sunscreen|perfume|nykaa|mamaearth|purplle|cosmetic|skincare)\b/i],
  ["Personal Care", /\b(shampoo|conditioner|soap|body wash|toothpaste|toothbrush|razor|trimmer|deodorant|hair oil)\b/i],
  ["Grocery", /\b(grocery|atta|rice|dal|oil|tea|coffee|snacks|food|jiomart|bigbasket|blinkit|zepto|instamart|masala|sugar)\b/i],
  ["Baby Products", /\b(baby|diaper|kids|toy|infant|stroller|feeding bottle)\b/i],
  ["Books", /\b(book|novel|study material|ebook|textbook|kindle)\b/i],
  ["Gaming", /\b(gaming|console|controller|ps5|xbox|gamepad|playstation|nintendo)\b/i],
  ["Travel", /\b(travel|flight|hotel|bus|train|trip|booking|holiday|cab)\b/i],
  ["Food Offers", /\b(food offer|restaurant|swiggy|zomato|pizza|burger|meal|dining|eatclub)\b/i],
  ["Appliances", /\b(appliance|mixer|grinder|washing machine|refrigerator|fridge|microwave|air conditioner|ac\b|oven|geyser)\b/i],
  ["Home & Kitchen", /\b(kitchen|cookware|wonderchef|bedsheet|mattress|bottle|bucket|mug|stool|dustbin|bin|cooker|pan|furniture|home|storage|decor|sofa|container|curtain)\b/i],
  ["Fashion", /\b(shirt|jeans|t-shirt|tshirt|kurta|kurti|saree|dress|jacket|hoodie|top|clothing|fashion|ethnic|trouser)\b/i],
  ["Electronics", /\b(earbuds|earbud|headphones|speaker|charger|power bank|laptop|keyboard|mouse|monitor|camera|tablet|tv|television|cable)\b/i]
];

function detectCategory(title, messageText = "", platformUrl = "") {
  const value = `${title || ""}\n${messageText || ""}\n${platformUrl || ""}`.toLowerCase();
  const match = CATEGORY_RULES.find(([, pattern]) => pattern.test(value));
  return match?.[0] || "Other Deals";
}

module.exports = { CATEGORY_RULES, detectCategory };
