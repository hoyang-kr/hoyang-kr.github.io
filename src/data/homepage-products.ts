export type HomepageFeaturedProductConfig = {
  id: string;
  displayName?: string;
};

export const homepageFeaturedProductConfigs: readonly HomepageFeaturedProductConfig[] =
  [
    {
      id: "belair-towel-bar",
    },
    {
      id: "batuta-paper-holder",
      displayName: "벨레어 휴지걸이",
    },
    {
      id: "concord-towel-bar",
    },
    {
      id: "concord-paper-holder",
    },
    {
      id: "hg110s",
    },
    {
      id: "hg112s",
    },
    {
      id: "hg9992",
    },
    {
      id: "hg55s",
    },
    {
      id: "hg392ms",
    },
    {
      id: "hg100ms",
    },
    {
      id: "hg822s",
    },
    {
      id: "hg01ms",
    },
    {
      id: "hg513",
    },
    {
      id: "hg05",
    },
  ] as const;
