declare const RAD: number;
declare const scrn: HTMLCanvasElement;
declare const sctx: CanvasRenderingContext2D;
declare let gameFrames: number;
declare const dx: number;
declare const state: {
    curr: number;
    getReady: number;
    Play: number;
    gameOver: number;
};
declare const SFX: {
    start: HTMLAudioElement;
    flap: HTMLAudioElement;
    score: HTMLAudioElement;
    hit: HTMLAudioElement;
    die: HTMLAudioElement;
    played: boolean;
};
interface Ground {
    sprite: HTMLImageElement;
    x: number;
    y: number;
    draw(): void;
    update(): void;
}
declare const gnd: Ground;
declare const bg: {
    sprite: HTMLImageElement;
    x: number;
    y: number;
    draw: () => void;
};
declare const pipe: {
    top: {
        sprite: HTMLImageElement;
    };
    bot: {
        sprite: HTMLImageElement;
    };
    gap: number;
    moved: boolean;
    pipes: {
        x: number;
        y: number;
    }[];
    draw: () => void;
    update: () => void;
};
declare const bird: {
    animations: {
        sprite: HTMLImageElement;
    }[];
    rotatation: number;
    x: number;
    y: number;
    speed: number;
    gravity: number;
    thrust: number;
    frame: number;
    draw: () => void;
    update: () => void;
    flap: () => void;
    setRotation: () => void;
    collisioned: () => boolean;
};
declare const UI: {
    getReady: {
        sprite: HTMLImageElement;
    };
    gameOver: {
        sprite: HTMLImageElement;
    };
    tap: {
        sprite: HTMLImageElement;
    }[];
    score: {
        curr: number;
        best: number;
    };
    x: number;
    y: number;
    tx: number;
    ty: number;
    frame: number;
    draw: () => void;
    drawScore: () => void;
    update: () => void;
};
declare function gameLoop(): void;
declare function update(): void;
declare function draw(): void;
