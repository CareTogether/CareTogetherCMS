import { atom, useAtom } from 'jotai';

export const showGlobalSnackBar = atom<string | null>(null);

export function useGlobalSnackBar() {
  const [message, setMessage] = useAtom(showGlobalSnackBar);

  return {
    message,
    setAndShowGlobalSnackBar: (newMessage: string) => {
      setMessage((currentMessage) => {
        if (currentMessage === null) {
          return newMessage;
        }

        // If newMessage is equal to the currentMessage, add a " (x)" at the end
        // to indicate how many times that notification was shown.
        const match = currentMessage
          ?.replace(newMessage, '')
          .match(/^\s\((\d)\)$/);

        const currentMessageIncludesCounter = match !== null;

        const isADuplicatedMessage =
          currentMessageIncludesCounter || currentMessage === newMessage;

        const currentMessageNumber = match ? parseInt(match[1]) : 0;

        if (isADuplicatedMessage) {
          return `${newMessage} (${currentMessageNumber + 1})`;
        }

        return newMessage;
      });
    },
    resetSnackBar: () => {
      setMessage(null);
    },
  };
}
