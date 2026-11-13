import type { Item } from "../types";

type ItemButtonProps = {
  item: Item;
  onClick: (name: string) => void;
};

export function ItemButton({ item, onClick }: ItemButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.name)}
      className="w-full border border-gray-200 bg-white px-1 py-3 text-center text-sm wrap-break-word shadow-xs transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:px-4 sm:text-base"
    >
      {item.name}
    </button>
  );
}
