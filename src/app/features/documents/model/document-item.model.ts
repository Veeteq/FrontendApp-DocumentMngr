import { Item } from "./item.model";

export interface DocumentItem {
  documentItemId: number;
  item: Item;
  itemQuantity: number;
  itemPrice: number;
  itemComment?: string;
  version: number;
}
