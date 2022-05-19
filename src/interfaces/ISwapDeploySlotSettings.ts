export interface ISwapDeploySlotSettings {
  name: string;
  resourceGroup: string;
  // empty mean use default subscription
  subscription?: string;
  slot: string;
  target_slot: string;
}
