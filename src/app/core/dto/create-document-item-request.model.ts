export interface CreateDocumentItemRequest {
  itemType: string;
  itemId: number;
  itemQuantity: number;
  itemPrice: number;
  itemDescription?: string;
}