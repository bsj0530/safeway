export interface PlaceItem {
  id: string;
  placeName: string;
  addressName: string;
  roadAddressName: string;
  x: string;
  y: string;
}

export interface FavoritePlace extends PlaceItem {
  nickname?: string;
}
