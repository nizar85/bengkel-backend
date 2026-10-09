import { ROLE } from '../../constants/roles.js';
import {
  toDashboardAdminDTO,
  toDashboardKasirDTO,
  toDashboardMekanikDTO,
} from './dashboard.dto.js';
import * as service from './dashboard.service.js';

const PEMBENTUK_DTO = {
  [ROLE.ADMIN]: toDashboardAdminDTO,
  [ROLE.KASIR]: toDashboardKasirDTO,
  [ROLE.MEKANIK]: toDashboardMekanikDTO,
};

export async function lihat(req, res) {
  const dashboard = await service.ambilDashboard(req.user);
  res.json({ data: PEMBENTUK_DTO[req.user.role](dashboard) });
}
