import * as THREE from 'three';
import { GameObject } from "../objects/GameObject.js";
import { MyMath } from 'src/monax/MyMath.js';

export function getTargetInSector(params: {
  objects: GameObject[],
  center: THREE.Vector3,
  directionAngle: number, // dir angle in rad
  sectorAngle: number, // angle in rad
  maxRadius: number,
  isIncSectorAngle: boolean,
}): GameObject | null {

  // console.log(`getTargetInSector: objects.len: ${params.objects.length}`);        
  
  const maxSectorAngle = Math.PI * 2;  // 360 deg
  let sectorAngle = params.sectorAngle;

  const isMeshInSector = (mesh: GameObject, angle: number): {
    inSector: boolean,
    dist: number
  } => {

    const position = mesh.position.clone().sub(params.center);
    const distance = position.length();

    if (distance > params.maxRadius) {
      return {
        inSector: false,
        dist: distance
      }
    }

    // calc angle between sector dir and object
    const objectAngle = Math.atan2(position.z, position.x);
    const angleDifference = THREE.MathUtils.euclideanModulo(objectAngle - params.directionAngle + Math.PI, Math.PI * 2) - Math.PI;

    return {
      inSector: Math.abs(angleDifference) <= angle / 2,
      dist: distance
    }
  };

  // sector inc cycle
  let lastDist = Number.MAX_SAFE_INTEGER;
  let target: GameObject;

  while (true) {

    // console.log(`params:`, {
    //   sectorAngle: MyMath.toDeg(sectorAngle),
    //   directionAngle: MyMath.toDeg(params.directionAngle),
    // });

    for (let obj of params.objects) {
      let inSec = isMeshInSector(obj, sectorAngle);
      if (inSec.inSector && inSec.dist < lastDist) {
        lastDist = inSec.dist;
        target = obj;
      }
    }

    if (target) break;
    if (!params.isIncSectorAngle) break;

    // inc sector angle
    if (sectorAngle >= maxSectorAngle) break;
    sectorAngle += Math.max(Math.PI / 20, sectorAngle * 1.1);

  }

  return target;
}