/**
 * Check if the permission level is a member
 * @param permissionLevel - The permission level
 * @param orHigher - Whether to check if the permission level is higher or equal to the given permission level
 * @returns Whether the permission level is a member
 */
export function isMember(permissionLevel: number, orHigher: boolean = true) {
  return orHigher ? permissionLevel >= 2 : permissionLevel === 2;
}

/**
 * Check if the permission level is a channel mod
 * @param permissionLevel - The permission level
 * @param orHigher - Whether to check if the permission level is higher or equal to the given permission level
 * @returns Whether the permission level is a channel mod
 */
export function isChannelMod(permissionLevel: number, orHigher: boolean = true) {
  return orHigher ? permissionLevel >= 3 : permissionLevel === 3;
}

/**
 * Check if the permission level is a channel admin
 * @param permissionLevel - The permission level
 * @param orHigher - Whether to check if the permission level is higher or equal to the given permission level
 * @returns Whether the permission level is a channel admin
 */
export function isChannelAdmin(permissionLevel: number, orHigher: boolean = true) {
  return orHigher ? permissionLevel >= 4 : permissionLevel === 4;
}

/**
 * Check if the permission level is a server admin
 * @param permissionLevel - The permission level
 * @param orHigher - Whether to check if the permission level is higher or equal to the given permission level
 * @returns Whether the permission level is a server admin
 */
export function isServerAdmin(permissionLevel: number, orHigher: boolean = true) {
  return orHigher ? permissionLevel >= 5 : permissionLevel === 5;
}

/**
 * Check if the permission level is a server owner
 * @param permissionLevel - The permission level
 * @param orHigher - Whether to check if the permission level is higher or equal to the given permission level
 * @returns Whether the permission level is a server owner
 */
export function isServerOwner(permissionLevel: number, orHigher: boolean = true) {
  return orHigher ? permissionLevel >= 6 : permissionLevel === 6;
}

/**
 * Check if the permission level is a staff
 * @param permissionLevel - The permission level
 * @param orHigher - Whether to check if the permission level is higher or equal to the given permission level
 * @returns Whether the permission level is a staff
 */
export function isStaff(permissionLevel: number, orHigher: boolean = true) {
  return orHigher ? permissionLevel >= 7 : permissionLevel === 7;
}

/**
 * Check if the permission level is a super admin
 * @param permissionLevel - The permission level
 * @returns Whether the permission level is a super admin
 */
export function isSuperAdmin(permissionLevel: number) {
  return permissionLevel === 8;
}
