import UsersModel from './usersModel'
import NotesModel from './notesModel'
import TenantModel from './tenantsModel'
import PropertiesModel from './propertiesModel'

interface TicketsModel {
  id: string,
  issue: string,
  userIds: Array<string>,
  users?: Array<UsersModel>,
  tenantId: string,
  tenant?: TenantModel | string,
  propertyId: string,
  property?: PropertiesModel,
  notesIds?: Array<string>,
  notes?: Array<NotesModel>,
  urgency: string,
  status: {
    isOpen: boolean,
    recieved: boolean,
    inProgress: boolean,
    closedByStaff: boolean,
    closedByPropertyManager: boolean,
    closedByOther: boolean
  }
}

export default TicketsModel
