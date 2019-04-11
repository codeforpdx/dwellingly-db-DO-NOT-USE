interface EmergencyNumbersModel {
  id: string,
  contact: string,
  subtext: string,
  phoneNumberOne: {
    number: string,
    subtext?: string,
    ext?: string
  },
  phoneNumberTwo?: {
    number?: string,
    subtext?: string,
    ext?: string
  },
  phoneNumberThree?: {
    number: string,
    subtext?: string,
    ext?: string
  }
}

export default EmergencyNumbersModel
