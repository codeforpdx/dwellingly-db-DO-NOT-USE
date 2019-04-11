import LeaseModel from './../models/leaseModel'
import PropertiesModel from './../models/propertiesModel'
import UsersModel from './usersModel';
import TicketsModel from './ticketsModel';
import NotesModel from './notesModel'

interface TenantsModel {
  id: string,
  firstName: string,
  lastName: string,
  staffIds: Array<string>,
  staffList?: Array<UsersModel>,
  ticketsIds: Array<string>,
  ticketsList?: Array<TicketsModel>
  propertyId: string,
  property?: PropertiesModel | string,
  leaseId: string,
  lease?: LeaseModel,
  dateCreated?: string,
  dateUpdated?: string
}

export default TenantsModel
