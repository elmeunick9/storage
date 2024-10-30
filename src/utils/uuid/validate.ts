import REGEX from './regex.ts';

function validate(uuid: unknown) {
    return typeof uuid === 'string' && REGEX.test(uuid);
}

export default validate;