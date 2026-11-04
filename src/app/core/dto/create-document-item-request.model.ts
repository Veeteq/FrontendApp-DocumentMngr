import { ItemType } from "../../features/documents/model/item-type.model";

export interface CreateDocumentItemRequest {
  itemType: ItemType;
  itemId: number;
  itemQuantity: number;
  itemPrice: number;
  itemDescription?: string;
}