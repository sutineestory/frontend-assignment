import type { Item } from "../types";
import { ItemButton } from "./item-button";

type ItemListProps = {
  items: Item[];
  onItemClick: (name: string) => void;
};

export function ItemList({ items, onItemClick }: ItemListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.name}>
          <ItemButton item={item} onClick={onItemClick} />
        </li>
      ))}
    </ul>
  );
}
