export interface ISetDeploySlotSetting {
  name: string;
  resourceGroup: string;
  // empty mean use default subscription
  subscription?: string;
  // empty mean use default deployment slot
  slot?: string;
}
