/**
 * 마작패 코드를 background-position 값으로 변환
 * @param code 마작패 코드 (예: '1m', '5p', '3s', '4z')
 * @returns {x: number, y: number} background-position에 사용할 pixel 값
 */
export function getTilePosition(code: string): { x: number; y: number } {
  const match = code.match(/^(\d+)([mpsz])$/);
  
  if (!match) {
    throw new Error(`Invalid tile code: ${code}`);
  }

  const number = parseInt(match[1]);
  const suit = match[2];

  // 숫자 범위 검증
  if (number < 1 || number > 9 || (suit === 'z' && number > 7)) {
    throw new Error(`Invalid tile code: ${code}`);
  }

  // y축 위치 결정 (suit별로 고정)
  let y = 0;
  switch (suit) {
    case 'm': // 만(bamboo)
      y = 0;
      break;
    case 'p': // 통(characters)
      y = -44;
      break;
    case 's': // 소(dots)
      y = -88;
      break;
    case 'z': // 자(honors)
      y = -132;
      break;
  }

  // x축 위치 결정 (숫자별로 -30px씩 변경)
  const x = 0;
  const xOffset = -(number - 1) * 30;

  return { x: xOffset, y };
}

/**
 * 마작패 코드 배열을 받아서 배경 위치 배열 반환
 * @param codes 마작패 코드 배열
 * @returns 배경 위치 배열
 */
export function getTilePositions(codes: string[]): Array<{ x: number; y: number }> {
  return codes.map(code => getTilePosition(code));
}

/**
 * 마작패 코드를 CSS background-position 스타일 문자열로 변환
 * @param code 마작패 코드
 * @returns CSS background-position 값
 */
export function getTileBackgroundPosition(code: string): string {
  const pos = getTilePosition(code);
  return `${pos.x}px ${pos.y}px`;
}
