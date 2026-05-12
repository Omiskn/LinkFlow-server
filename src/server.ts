import app from "./app";
import { env } from "./config/env";

// console.log(env);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
