import {nodeResolve} from '@rollup/plugin-node-resolve';


export default {
  input: './esm/index.js',
  plugins: [
    nodeResolve(),
  ],
  output: {
    esModule: true,
    file: './index.js',
  }
};
