import { c, Config } from "./cron";

Config.log = true;

c.every(c.minute() * 30)
  .do(async (info) => {
    await fetch(process.env.API_ENDPOINT!, {
      method: "POST",
      headers: {
        ["authorization"]: `Bearer ${process.env.GH_API_KEY}`,
      },
    });
  })
  .exec({ startImmediately: true });
