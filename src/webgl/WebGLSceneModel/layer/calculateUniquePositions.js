/**
 * @author https://github.com/tmarti, with support from https://tribia.com/
 * @license MIT
 * 
 * This file takes a geometry given by { positions, indices }, and returns
 * equivalent { positions, indices } arrays but which only contain unique
 * positions.
 * 
 * The time is O(N logN) with the number of positions due to a pre-sorting
 * step, but is much more GC-friendly and actually faster than the classic O(N)
 * approach based in keeping a hash-based LUT to identify unique positions.
 */
 let comparePositions = null;

function compareVertex (a, b) {
    let res;

    for (let i = 0; i < 3; i++) {
        if (0!= (res = comparePositions[a*3+i] - comparePositions[b*3+i]))
        {
            return res;
        }
    }

    return 0;
};

let seqInit = null;

function setMaxNumberOfPositions (maxPositions)
{
    if (seqInit !== null && seqInit.length >= maxPositions)
    {
        return;
    }

    seqInit = new Uint32Array(maxPositions);

    for (let i = 0; i < maxPositions; i++)
    {
        seqInit[i] = i;
    }
}

/**
 * This function obtains unique positions in the provided object
 * .positions array and calculates an index mapping, which is then
 * applied to the provided object .indices and .edgeindices.
 * 
 * The input object items are not modified, and instead new set
 * of positions, indices and edgeIndices with the applied optimization
 * are returned.
 * 
 * The algorithm, instead of being based in a hash-like LUT for
 * identifying unique positions, is based in pre-sorting the input
 * positions...
 * 
 * (it's possible to define a _"consistent ordering"_ for the positions
 *  as positions are quantized and thus not suffer from float number
 *  comparison artifacts)
 * 
 * ... so same positions are adjacent in the sorted array, and then
 * it's easy to scan linearly the sorted array. During the linear run,
 * we will know that we found a different position because the comparison
 * function will return != 0 between current and previous element.
 * 
 * During this linear traversal of the array, a `unique counter` is used
 * in order to calculate the mapping between original indices and unique
 * indices.
 * 
 * @param {*} mesh The input mesh to process, with `positions`, `indices` and `edgeIndices` keys.
 * 
 * @returns An array with 3 elements: 0 => the uniquified positions; 1 and 2 => the remapped edges and edgeIndices arrays
 */
function uniquifyPositions(mesh)
{
    let _positions = mesh.positions;
    let _indices = mesh.indices;
    let _edgeIndices = mesh.edgeIndices;

    setMaxNumberOfPositions(_positions.length / 3);

    let seq = seqInit.slice (0, _positions.length / 3);
    let remappings = seqInit.slice (0, _positions.length / 3);

    comparePositions = _positions;

    seq.sort(compareVertex);

    let uniqueIdx = 0

    remappings[seq[0]] = 0;

    for (let i = 1, len = seq.length; i < len; i++)
    {
        if (0 != compareVertex(seq[i], seq[i-1]))
        {
            uniqueIdx++;
        }

        remappings[seq[i]] = uniqueIdx;
    }

    const numUniquePositions = uniqueIdx + 1;

    const uniquePositions = new Uint16Array (numUniquePositions * 3);

    uniqueIdx = 0

    uniquePositions [uniqueIdx * 3 + 0] = _positions [seq[0] * 3 + 0];
    uniquePositions [uniqueIdx * 3 + 1] = _positions [seq[0] * 3 + 1];
    uniquePositions [uniqueIdx * 3 + 2] = _positions [seq[0] * 3 + 2];
    
    for (let i = 1, len = seq.length; i < len; i++)
    {
        if (0 != compareVertex(seq[i], seq[i-1]))
        {
            uniqueIdx++;

            uniquePositions [uniqueIdx * 3 + 0] = _positions [seq[i] * 3 + 0];
            uniquePositions [uniqueIdx * 3 + 1] = _positions [seq[i] * 3 + 1];
            uniquePositions [uniqueIdx * 3 + 2] = _positions [seq[i] * 3 + 2];
        }

        remappings[seq[i]] = uniqueIdx;
    }

    comparePositions = null;

    let uniqueIndices = new Uint32Array (_indices.length);

    for (let i = 0, len = _indices.length; i < len; i++)
    {
        uniqueIndices[i] = remappings [
            _indices[i]
        ];
    }

    let uniqueEdgeIndices = new Uint32Array (_edgeIndices.length);

    for (let i = 0, len = _edgeIndices.length; i < len; i++)
    {
        uniqueEdgeIndices[i] = remappings [
            _edgeIndices[i]
        ];
    }

    return [
        uniquePositions,
        uniqueIndices,
        uniqueEdgeIndices
    ];
}


export { uniquifyPositions }