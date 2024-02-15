import { AuthGuardUser } from "@components/layout/auth";
import { api } from "@utils/api";
import { NextPageWithAuth, NextPageWithTitle } from "next";

const Party: NextPageWithAuth & NextPageWithTitle = () => {
  const { data: party } = api.party.get_all.useQuery();
  return <></>;
};

export default Party;
Party.auth = AuthGuardUser;
Party.title = "Party | Create";
