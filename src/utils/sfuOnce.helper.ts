import { sfuService } from "../services/sfu.service";

export function onceSfu<T = any>(
  action: string,
  cb: (msg: T) => void
) {
  const wrapper = (msg: T) => {
    cb(msg);
    sfuService.off(action, wrapper);
  };
  sfuService.on(action, wrapper);
}

