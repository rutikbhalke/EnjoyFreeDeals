require("dotenv").config();

const { validateEnv } = require("./middleware/envValidator");

const port = Number(process.env.PORT || 5000);

try {
  validateEnv();
  const app = require("./app");
  app.listen(port, () => {
    console.log(`EnjoyFreeDeals backend running on port ${port}`);
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
