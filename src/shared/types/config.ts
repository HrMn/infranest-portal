export interface ConfigItem {
  configType: string
  key:        string
  status:     'Active' | 'Inactive' | string
  rowIndex:   number
}

export interface AppUser {
  email:     string
  role:      string
  name:      string
  active:    string
  lastLogin: string
}
