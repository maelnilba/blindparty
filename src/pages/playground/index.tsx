import { getLanguage, getAcceptLanguage } from "helpers/accept-language";
import {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { useEffect } from "react";
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

  useEffect(() => {
    listenContinuously();
    return () => SpeechRecognition.stopListening();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <div>final: {finalTranscript}</div>
      <div>interim: {interimTranscript}</div>
      <div>transcript: {transcript}</div>
      <div>listening: {JSON.stringify(listening)}</div>
    </main>
  );
};

export default Home;
