import { Navigate } from 'react-router-dom';

// This file is just redirecting to the widgets list
// The actual edit component is in edit/[id].tsx and is accessed via the route /admin/widgets/edit/:id
const EditWidgetRedirect = () => {
    return <Navigate to="/admin/widgets" />;
};

export default EditWidgetRedirect; 
