import { INITIAL_ITEMS } from "../data";
import { BoardStoreProvider } from "../store-provider";
import { ITEM_TYPES } from "../types";
import { MainList } from "./main-list";
import { TypeColumn } from "./type-column";

export function Board() {
  return (
    <BoardStoreProvider items={INITIAL_ITEMS}>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <MainList />
        {ITEM_TYPES.map((type) => (
          <TypeColumn key={type} type={type} />
        ))}
      </div>
    </BoardStoreProvider>
  );
}
