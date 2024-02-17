import { getLanguage, getAcceptLanguage } from "helpers/accept-language";
import {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { ComponentProps, useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      language: getLanguage(
        getAcceptLanguage(context.req.headers["accept-language"]).at(0) ??
          context.locale ??
          context.defaultLocale ??
          "fr"
      ),
    },
  };
}
const Home: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ language }) => {
  const { finalTranscript, interimTranscript, transcript, listening } =
    useSpeechRecognition();

  const listenContinuously = async () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      return null;
    }

    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      console.warn(
        "Your browser does not support speech recognition software! Try Chrome desktop, maybe?"
      );
      return;
    }
    await SpeechRecognition.startListening({
      continuous: true,
      language: language,
    });
  };

  // useEffect(() => {
  //   listenContinuously();
  //   return () => SpeechRecognition.stopListening();
  // }, []);

  const [state, setState] = useState("");
  return (
    <main className="">
      <div>final: {finalTranscript}</div>
      <div>interim: {interimTranscript}</div>
      <div>transcript: {transcript}</div>
      <div>listening: {JSON.stringify(listening)}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = (
            (e.target as HTMLFormElement).elements.namedItem(
              "test"
            ) as HTMLInputElement
          ).value;
          setState(data);
        }}
      >
        {state}
        <input type="submit" hidden />
        <Input
          name="test"
          type="text"
          className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
        />
      </form>
    </main>
  );
};

const Input = (props: ComponentProps<"input">) => {
  return <input {...props} />;
};

export default Home;
