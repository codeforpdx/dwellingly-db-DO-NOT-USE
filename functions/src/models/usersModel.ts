import LeaseModel from './../models/leaseModel'

interface UsersModel {
  id: string,
  lastName: string,
  firstName: string,
  email: string,
  title?: string,
  leaseIds?: Array<string>,
  leases?: Array<LeaseModel> | Array<any>,
  phone?: string,
  ext?: string,
  role: {
    isAdmin: boolean,
    isPropertyManager: boolean,
    isStaff: boolean
  }
}

export default UsersModel
