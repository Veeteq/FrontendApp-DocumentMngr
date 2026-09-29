import { Item } from "./item.model";

export interface DocumentItem {
  documentItemId?: number;
  itemType: string;
  item?: Item;
  itemQuantity: number;
  itemPrice: number;
  itemComment?: string;
  version?: number;
}
