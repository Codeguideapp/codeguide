import { Form, Input, Modal, Select } from 'antd';
import { useAtom } from 'jotai';

import { selectedChangeIdsAtom, updateChangesAtom } from '../atoms/changes';
import { showAddCommentDialogAtom } from '../atoms/layout';

const { Option } = Select;

export function AddComment() {
  const [selectedChangeIds] = useAtom(selectedChangeIdsAtom);
  const [form] = Form.useForm();
  const [, updateChanges] = useAtom(updateChangesAtom);
  const [showAddComment, setAhowAddComment] = useAtom(showAddCommentDialogAtom);

  if (!showAddComment || selectedChangeIds.length === 0) {
    return null;
  }

  return (
    <Modal
      visible
      title="Add Comment"
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();

            updateChanges((changes) => {
              for (const id of selectedChangeIds) {
                const parentId = changes[id].parentChangeId || id;

                for (const childId of [
                  parentId,
                  ...changes[parentId].children,
                ]) {
                  changes[childId].text = values.comment;
                  changes[childId].textType = values.type;
                }
              }
            });
            setAhowAddComment(false);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
      onCancel={() => setAhowAddComment(false)}
      okText="Submit"
    >
      <Form form={form} labelCol={{ span: 4 }} initialValues={{ type: 'info' }}>
        <Form.Item name="type" label="Type">
          <Select>
            <Option value="info">Info</Option>
            <Option value="warn">Warning</Option>
            <Option value="question">Question</Option>
          </Select>
        </Form.Item>
        <Form.Item name="comment" label="Comment" rules={[{ required: true }]}>
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
}
