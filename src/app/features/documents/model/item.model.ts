import { ItemCategory } from "./item-category.model";

export interface Item {
  itemId: number;
  itemName: string;
  itemCategory: ItemCategory;
}
