declare const beep1: HTMLAudioElement;
declare const beep2: HTMLAudioElement;
declare const beep3: HTMLAudioElement;
declare enum Direction {
    IDLE = 0,
    UP = 1,
    DOWN = 2,
    LEFT = 3,
    RIGHT = 4
}
declare const rounds: number[];
declare const colors: string[];
interface BallType {
    width: number;
    height: number;
    x: number;
    y: number;
    moveX: Direction;
    moveY: Direction;
    speed: number;
}
interface PaddleType {
    width: number;
    height: number;
    x: number;
    y: number;
    score: number;
    move: Direction;
    speed: number;
    wins: number;
}
interface GameType {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    player: PaddleType;
    paddle: PaddleType;
    ball: BallType;
    running: boolean;
    over: boolean;
    turn: PaddleType | null;
    timer: number;
    round: number;
    color: string;
    initialize(): void;
    endGameMenu(text: string): void;
    menu(): void;
    update(): void;
    draw(): void;
    loop(): void;
    listen(): void;
    _resetTurn(victor: PaddleType, loser: PaddleType): void;
    _turnDelayIsOver(): boolean;
    _generateRoundColor(): string;
}
declare const Ball: {
    "new"(incrementedSpeed?: number, canvas?: HTMLCanvasElement): BallType;
};
declare const Paddle: {
    "new"(side: "left" | "right", canvas?: HTMLCanvasElement): PaddleType;
};
declare const Game: GameType;
declare let Pong: GameType;
