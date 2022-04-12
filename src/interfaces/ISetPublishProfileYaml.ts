export interface ISetPublishProfileYaml {
  name: string;
  resource_group: string;
  // empty mean use default subscription
  subscription?: string;
  // empty mean use default deployment slot
  slot?: string;
  // yq/jq expression syntax for getting a particular value
  property_path: string;
}
