import { z } from "zod";
import { createCommander } from "./argv";
import { Timer } from "./devtime";

const timer = new Timer();

createCommander({
  config: z.object({
    user: z.string(),
  }),
  run: z.null(),
})
  .on("config", (e) => {
    if (e.user)
      timer.config = {
        name: e.user,
      };
  })
  .on("run", (e) => {
    timer.exec();
  })
  .exec();

export {};
