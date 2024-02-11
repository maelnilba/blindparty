import { Picture } from "@components/images/picture";
import { ConfirmationModal } from "@components/modals/confirmation-modal";
import { Menu, Transition } from "@headlessui/react";
import { SubscriberProxy, useSubscriber } from "helpers/observable";
import { Player } from "pages/party/phone/[id]";
import { useEffect } from "react";

type PlayerStackProps = {
  players: Player[];
  onBan?: (id: string) => void;
};

export const PlayerStack = ({ players, onBan }: PlayerStackProps) => {
  const observable = useSubscriber({
    hover: false,
  });

  return (
    <div
      onMouseEnter={() => {
        observable.hover = false;
      }}
      onMouseLeave={() => {
        observable.hover = true;
      }}
      className="scrollbar-hide group/stack relative flex h-screen w-40 flex-col items-center gap-1 pb-24 pt-32"
    >
      {players.length < 5
        ? players.map((user, idx) => (
            <div
              key={user.id + idx}
              style={{ zIndex: 100 - idx }}
              className=" mt-2 cursor-pointer transition-all duration-200"
            >
              <ItemWrapper user={user} subscriber={observable} onBan={onBan} />
            </div>
          ))
        : players.map((user, idx) => (
            <div
              key={user.id + idx}
              style={{ zIndex: 100 - idx }}
              className="absolute z-10 mt-2 cursor-pointer transition-all duration-200 first:visible first:mt-0 first:scale-110 last:visible last:mt-4 last:scale-90 group-hover/stack:relative group-hover/stack:mt-0 group-hover/stack:scale-100"
            >
              <ItemWrapper user={user} subscriber={observable} onBan={onBan} />
            </div>
          ))}
    </div>
  );
};

type ItemWrapperProps = {
  user: Player;
  subscriber: SubscriberProxy<{ hover: boolean }>;
  onBan?: (id: string) => void;
};
const ItemWrapper = ({ user, subscriber, onBan }: ItemWrapperProps) => {
  return (
    <Menu as="div" className="relative inline-block">
      <Menu.Button as="button">
        <Transition
          show
          appear
          enter="transition-opacity duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-1000"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Picture identifier={user?.image} className="shrink-0">
            <img
              alt={`playlist picture of ${user.name}`}
              src={user.image!}
              className="aspect-square h-14 w-14 rounded border-gray-800 object-cover"
            />
          </Picture>
        </Transition>
      </Menu.Button>
      <Menu.Items
        as="div"
        className="absolute left-1/2 top-0 z-100 mt-2 hidden w-max origin-top-left rounded-md bg-black/80 ring-4 ring-white ring-opacity-5 backdrop-blur-sm focus:outline-none group-hover/stack:block"
      >
        <Menu.Item as="button">
          {({ active, close }) => (
            <Item
              user={user}
              subscriber={subscriber}
              close={close}
              active={active}
              onBan={onBan}
            />
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
};

type ItemProps = {
  active: boolean;
  close: () => void;
} & ItemWrapperProps;
const Item = ({ subscriber, user, close, active, onBan }: ItemProps) => {
  useEffect(() => {
    subscriber.subscribe("hover", (isHover) => {
      if (isHover && !active) {
        subscriber.hover = false;
        return;
      }
      close();
    });
    return () => {
      subscriber.unsubscribe("hover");
    };
  }, []);

  return (
    <ConfirmationModal
      title={`Exclure ${user.name}`}
      message={`Êtes vous certain de vouloir exclure ${user.name} de la partie ? Une fois exclu, il n'est plus possible de rejoindre la partie en cours`}
      actions={["Exclure"]}
      className="flex w-full items-center justify-center"
      onSuccess={() => {
        if (onBan) {
          onBan(user.id);
        }
      }}
    >
      <button
        className={`${
          active ? "opacity-75" : ""
        } group flex w-full items-center rounded-md p-4 text-sm ring-2 ring-white ring-opacity-5`}
      >
        Exclure {user.name}
      </button>
    </ConfirmationModal>
  );
};
