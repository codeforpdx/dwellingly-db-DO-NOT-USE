import PropertiesModel from './propertiesModel';

interface LeaseModel {
  propertyId: string,
  numberOfResidenceInUnit: number,
  property?: PropertiesModel,
  unit: string,
  tenantIds: Array<string>,
  tenants?: Array<any>,
  dateStart: string,
  dateEnd: string,
  dateCreated?: string,
  dateUpdated?: string,
  id: string
}

export default LeaseModel
