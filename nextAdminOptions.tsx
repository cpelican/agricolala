import type { NextAdminOptions } from "@premieroctet/next-admin";

const options: NextAdminOptions = {
  title: "My awesome admin",
  model: {
    User: {
      list: {
        display: ["name", "email", "isAdmin"],
      },
      edit: {
        display: ["name", "email", "isAdmin"],
      },
    },
    Parcel: {
      list: {
        display: ["name", "latitude", "longitude", "width", "height", "type", "user", "treatments"],
      },
      edit: {
        display: ["name", "latitude", "longitude", "width", "height", "type", "user", "treatments"],
      },
    },
    Product: {
      list: {
        display: ["name", "brand", "maxCumulatedQuantity", "maxApplications", "composition", "productApplications"],
      },
    },
    Substance: {
      list: {
        display: ["name", "maxDosage", "targets", "substanceDoses"],
      },
    },
    Disease: {
      list: {
        display: ["name", "description"],
      },
      edit: {
        display: ["name", "description"],
      },
    },
  },
  sidebar: {
    groups: [
      {
        className: 'pt-5 text-lg !text-white !bg-gray-800',
        title: 'Models',
        models: [
          'User',
          'Parcel',
          'Product',
          'Substance',
          'Disease',
        ],
      },
    ],
  },
}

export default options;
