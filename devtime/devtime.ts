import fs from "fs";
import path from "path";
const modulePath = path.dirname(__filename) + "/module";
const configPath = modulePath + "/config.json";
const dbPath = modulePath + "/db.json";

if (!fs.existsSync(modulePath)) {
  fs.mkdirSync(modulePath);
}

type Config = {
  name: string;
};
type DB = {
  [user: string]: [string, string][];
};

export class Timer {
  private _config: Config = { name: "USER" };
  private db: DB = {};
  private start?: Date;
  constructor() {
    fs.access(configPath, (err) => {
      if (err) {
        fs.writeFile(
          configPath,
          JSON.stringify(this._config, null, 2),
          (err) => {
            if (err) throw err;
          }
        );
      } else {
        fs.readFile(configPath, "utf8", (err, data) => {
          if (err) throw err;
          const config = JSON.parse(data);
          this._config = config;
        });

        fs.readFile(dbPath, "utf8", (err, data) => {
          if (err) {
            this.db = {
              [this._config.name]: [],
            };
            fs.writeFile(dbPath, JSON.stringify(this.db, null, 2), (err) => {
              if (err) throw err;
            });
          } else {
            const db = JSON.parse(data);
            if (!db[this._config.name]) {
              this.db = { ...db, [this._config.name]: [] };
            } else {
              this.db = db;
            }
            this.db = db;
          }
        });
      }
    });
  }
  set config(config: Config) {
    this._config = config;
    fs.writeFile(configPath, JSON.stringify(this._config, null, 2), (err) => {
      if (err) throw err;
    });
  }

  exec() {
    process.stdin.resume();
    this.start = new Date();
    cleanup(() => {
      if (this.db && this.start) {
        if (!this.db[this._config.name]) {
          this.db = { ...this.db, [this._config.name]: [] };
        }
        this.db[this._config.name]?.push([
          this.start.toISOString(),
          new Date().toISOString(),
        ]);
        fs.writeFileSync(dbPath, JSON.stringify(this.db, null, 2));
      }
    });
  }
}

function cleanup(cb: (...args: any) => void) {
  const callback: (...args: any) => void = cb || function () {};
  process.on("cleanup", callback);
  process.on("exit", function () {
    process.emit("cleanup" as any);
  });
  process.on("SIGINT", function () {
    process.exit(2);
  });
  process.on("uncaughtException", function (e) {
    process.exit(99);
  });
}
