import { AuthGuardUser } from "@components/layout/auth";
import { PartyCard } from "@components/party/party-card";
import { api } from "@utils/api";
import { NextPageWithAuth, NextPageWithTitle } from "next";

const Party: NextPageWithAuth & NextPageWithTitle = () => {
  const { data: party } = api.party.get_all.useQuery();
  return (
    <div className="flex flex-wrap gap-4 p-4 px-28">
      {party?.map((party) => (
        <PartyCard key={party.id} party={party} />
      ))}
    </div>
  );
};

export default Party;
Party.auth = AuthGuardUser;
Party.title = "Party | Create";
