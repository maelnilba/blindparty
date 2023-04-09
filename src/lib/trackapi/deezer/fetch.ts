/*
 * S/o to https://github.com/camsong/fetch-jsonp
 */

interface Options {
  timeout?: number;
  jsonpCallback?: string;
  jsonpCallbackFunction?: string;
  nonce?: string;
  referrerPolicy?: ReferrerPolicy;
  charset?: string;
}

interface Response {
  json(): Promise<any>;
  json<T>(): Promise<T>;
  ok: boolean;
}

const defaultOptions = {
  timeout: 5000,
  jsonpCallback: "callback",
  jsonpCallbackFunction: null,
};

function generateCallbackFunction() {
  return `jsonp_${Date.now()}_${Math.ceil(Math.random() * 100000)}`;
}

function clearFunction(functionName: string) {
  // IE8 throws an exception when you try to delete a property on window
  // http://stackoverflow.com/a/1824228/751089
  if (typeof window === "undefined") return;

  try {
    delete window[functionName as any];
  } catch (e) {
    window[functionName as any] = undefined as any;
  }
}

function removeScript(scriptId: string) {
  const script = document.getElementById(scriptId);
  if (script) {
    const doc = document.getElementsByTagName("head")[0];
    if (doc) doc.removeChild(script);
  }
}

function fetchJsonp(_url: string, options: Options = {}): Promise<Response> {
  // to avoid param reassign
  let url = _url;
  const timeout = options.timeout || defaultOptions.timeout;
  const jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

  let timeoutId: NodeJS.Timeout | undefined;

  return new Promise((resolve, reject) => {
    const callbackFunction =
      options.jsonpCallbackFunction || generateCallbackFunction();
    const scriptId = `${jsonpCallback}_${callbackFunction}`;

    // @ts-ignore
    window[callbackFunction] = (response: Response) => {
      resolve({
        ok: true,
        // keep consistent with fetch API
        json: () => Promise.resolve(response),
      });

      if (timeoutId) clearTimeout(timeoutId);

      removeScript(scriptId);

      clearFunction(callbackFunction);
    };

    // Check if the user set their own params, and if not add a ? to start a list of params
    url += url.indexOf("?") === -1 ? "?" : "&";

    const jsonpScript = document.createElement("script");
    jsonpScript.setAttribute(
      "src",
      `${url}${jsonpCallback}=${callbackFunction}`
    );
    if (options.charset) {
      jsonpScript.setAttribute("charset", options.charset);
    }
    if (options.nonce) {
      jsonpScript.setAttribute("nonce", options.nonce);
    }
    if (options.referrerPolicy) {
      jsonpScript.setAttribute("referrerPolicy", options.referrerPolicy);
    }
    jsonpScript.id = scriptId;
    const doc = document.getElementsByTagName("head")[0];
    if (doc) doc.appendChild(jsonpScript);

    timeoutId = setTimeout(() => {
      reject(new Error(`JSONP request to ${_url} timed out`));

      clearFunction(callbackFunction);
      removeScript(scriptId);
      // @ts-ignore
      window[callbackFunction] = () => {
        clearFunction(callbackFunction);
      };
    }, timeout);

    // Caught if got 404/500
    jsonpScript.onerror = () => {
      reject(new Error(`JSONP request to ${_url} failed`));

      clearFunction(callbackFunction);
      removeScript(scriptId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
}

export default fetchJsonp;
