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

/**
 * 연달아 입력된 마작패 코드를 파싱하여 개별 타일 코드 배열로 변환
 * 예: '123m35678p12399s' -> ['1m', '2m', '3m', '3p', '5p', '6p', '7p', '8p', '1s', '2s', '3s', '9s', '9s']
 * @param input 연달아 입력된 마작패 코드 문자열
 * @returns 개별 타일 코드 배열
 */
export function parseTileString(input: string): string[] {
  const tiles: string[] = [];
  let currentNumbers = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i].toLowerCase();

    if (/\d/.test(char)) {
      // 숫자인 경우 누적
      currentNumbers += char;
    } else if (/[mpsz]/.test(char)) {
      // 마작패 종류 문자인 경우
      if (!currentNumbers) {
        throw new Error(`코드 오류: ${char} 앞에 숫자가 없습니다.`);
      }

      // 현재까지 누적된 숫자들을 각각의 타일로 변환
      for (const digit of currentNumbers) {
        const number = parseInt(digit);
        const tileCode = `${number}${char}`;

        // 유효성 검사
        try {
          getTilePosition(tileCode);
          tiles.push(tileCode);
        } catch (error) {
          throw new Error(`유효하지 않은 타일 코드: ${tileCode}`);
        }
      }

      currentNumbers = '';
    } else {
      throw new Error(`허용되지 않는 문자: ${char}`);
    }
  }

  if (currentNumbers) {
    throw new Error(`코드 오류: 끝에 숫자만 있고 종류(m, p, s, z)가 없습니다.`);
  }

  return tiles;
}
