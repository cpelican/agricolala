import type { NextAdminOptions } from "@premieroctet/next-admin";

const options: NextAdminOptions = {
  title: "My awesome admin",
  model: {
    User: {
      list: {
        display: ["name", "email", 'parcels', 'treatments'],
      },
      edit: {
        display: ["name", "email", 'parcels', 'treatments'],
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
    Treatment: {
      list: {
        display: ["name", "target", "type", "maxCumulatedQuantity", "maxApplications", "description", "dateMin", "dateMax", "appliedDate", "status", "waterDose", "parcel", "user", "productApplications"],
      },
    },
    ProductApplication: {
      list: {
        display: ["dose", "treatment", "product"],
      },
    },
    Product: {
      list: {
        display: ["name", "brand", "composition", "productApplications"],
      },
    },
    SubstanceDose: {
      list: {
        display: ["dose", "substance", "product"],
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
    },
  },
  sidebar: {
    groups: [
      {
        title: "Users",
        className: "!text-white !bg-green-600 p-2 rounded-md",
        models: ["User"],
      },
      {
        className: 'pt-5 text-lg !text-white !bg-gray-800',
        title: 'Models',
        models: [
          'Parcel',
          'Treatment',
          'ProductApplication',
          'Product',
          'SubstanceDose',
          'Substance',
          'Disease',
        ],
      },
    ],
  },
}

export default options;
