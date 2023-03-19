import env from "./env";
env();

type Do<TState = undefined> = (
  infos: JobInfo,
  state: TState extends undefined ? never : TState | null
) => TState extends undefined ? void | Promise<void> : TState | Promise<TState>;

class Cron {
  private time: number;
  constructor(time: number) {
    this.time = time;
  }
  do<TState = undefined>(callback: Do<TState>) {
    return new Job(this.time, callback);
  }
}

type JobInfo = {
  createdAt: Date;
  startedAt: Date;
  lastRunAt: Date;
  /**
   * The lastDuration in milliseconds
   */
  lastDuration: number;
  lastEndAt: Date;
  runAt: Date;
  runCount: number;
  /**
   * The identifier of the job, increment each run
   */
  jobNumber: number;
  lastError: LastError | null;
};

type LastError = {
  jobNumber: number;
  error: unknown | null;
};

type Exec = {
  startImmediately?: boolean;
};

class Job {
  private time: number;
  private do_cb: Do<any>;
  private createdAt: Date;
  constructor(time: number, do_cb: Do<any>) {
    this.time = time;
    this.do_cb = do_cb;
    this.createdAt = new Date();
  }
  exec(options?: Exec) {
    const startedAt = new Date();
    let lastError: LastError | null = null;
    let lastDuration = 0;
    let lastEndAt = new Date();
    let runCount = 1;
    let state: any = null;
    let runAt = new Date();
    let lastRunAt = runAt;

    const jobRunner = async () => {
      let returnState;

      lastRunAt = runAt;
      runAt = new Date();
      try {
        returnState = await this.do_cb(
          {
            createdAt: this.createdAt,
            startedAt: startedAt,
            jobNumber: runCount,
            lastRunAt: lastRunAt,
            lastError: { jobNumber: runCount, error: lastError },
            lastDuration: lastDuration,
            lastEndAt: lastEndAt,
            runAt: runAt,
            runCount: runCount,
          },
          state
        );
        state = returnState;
        if (Config?.log) {
          console.log(
            "\x1b[36m%s\x1b[0m",
            `[${logTime()}] The job ${runCount} has run with success`
          );
        }
      } catch (error) {
        if (Config?.log) {
          console.log(
            "\x1b[31m%s\x1b[0m",
            `[${logTime()}] The job ${runCount} has run with error \n`
          );
          console.error(error);
        }
        lastError = { jobNumber: runCount, error: error };
      } finally {
        lastEndAt = new Date();
        lastDuration = runAt.valueOf() - lastEndAt.valueOf();
        runCount++;
      }
    };

    if (options?.startImmediately) {
      jobRunner();
    }

    return setInterval(jobRunner, this.time);
  }
}

const logTime = () => {
  return new Date().toISOString().slice(11, 19);
};

const times = Object.freeze({
  second: () => 1000 * 1,
  minute: () => 60 * 1000,
  hour: () => 60 * 60 * 1000,
  day: () => 24 * 60 * 60 * 1000,
  week: () => 7 * 24 * 60 * 60 * 1000,
  month: () => 4 * 7 * 24 * 60 * 60 * 1000,
  year: () => 52 * 4 * 7 * 24 * 60 * 60 * 1000,
});

export const c = Object.freeze({
  every: (time: number) => new Cron(time),
  ...times,
});

export const Config = {
  log: true,
};
