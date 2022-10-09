/**
 * Data type from which a {@link DataModel} is created.
 */
import {PropertySetCfg} from "./PropertySetCfg";
import {DataObjectCfg} from "./DataObjectCfg";

/**
 * Parameters for creating a {@link DataModel} with {@link Data.createDataModel}.
 */
export interface DataModelCfg {

    /**
     * Unique ID of the DataModel.
     */
    id?: string,

    /**
     * The project ID, if available.
     */
    projectId?: string | number,

    /**
     * The model ID, if available.
     */
    revisionId?: string | number,

    /**
     * The author, if available.
     */
    author?: string,

    /**
     * The data the model was created, if available.
     */
    createdAt?: string,

    /**
     * The application that created the model, if known.
     */
    creatingApplication?: string,

    /**
     * The model schema version, if available.
     */
    schema?: string,

    /**
     * The {@link PropertySet}s in the DataModel.
     */
    propertySets?: PropertySetCfg[],

    /**
     * The {@link DataObject}s in the DataModel.
     */
    dataObjects?: DataObjectCfg[]
}